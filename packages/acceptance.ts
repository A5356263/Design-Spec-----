import assert from "node:assert/strict";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateCandidateFile } from "./evaluate";
import { runMainline, stageFiles } from "./mainline";
import { requestRollback, resolveRollback } from "./rollback";
import { writeStageFile } from "./stage-guard";

function projectRoot(): string {
  return process.cwd();
}

async function testStageWriteGuard(root: string): Promise<void> {
  const invalidTarget = path.join(root, "workdir/runtime/illegal-write.txt");
  await assert.rejects(
    () => writeStageFile(root, "stage_1_skeleton", invalidTarget, "x\n"),
    /硬卡口失败/
  );
}

async function testCatalogDynamicLoad(root: string): Promise<void> {
  await runMainline(root);
  const catalogPath = path.join(root, "config/ANT_LITE_CATALOG.json");
  const stageDir = path.join(root, "workdir/workspace/stage_2_components");
  const candidatePath = path.join(stageDir, "candidate.page.json");
  const evaluationPath = path.join(stageDir, "evaluation.md");

  const oldCatalogRaw = await readFile(catalogPath, "utf8");
  const catalog = JSON.parse(oldCatalogRaw.replace(/^\uFEFF/, ""));

  try {
    delete catalog.types.Button;
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    const failResult = await evaluateCandidateFile(root, "stage_2_components", candidatePath, evaluationPath);
    assert.equal(failResult.passed, false, "移除 Button 后评估应失败");
  } finally {
    await writeFile(catalogPath, oldCatalogRaw.endsWith("\n") ? oldCatalogRaw : `${oldCatalogRaw}\n`, "utf8");
  }

  const passResult = await evaluateCandidateFile(root, "stage_2_components", candidatePath, evaluationPath);
  assert.equal(passResult.passed, true, "恢复 catalog 后评估应通过");
}

async function testRequiredDocsExist(root: string): Promise<void> {
  const requiredFiles = [
    "AGENT_ENTRY.md",
    "RESOURCE_MANIFEST.md",
    "FLAT_JSON_PROTOCOL.md",
    "specs/01_mainline_contract.md",
    "specs/02_stage_contract.md",
    "specs/03_snapshot_contract.md"
  ];
  for (const rel of requiredFiles) {
    const content = await readFile(path.join(root, rel), "utf8");
    assert.equal(content.trim().length > 0, true, `${rel} 不应为空`);
  }
}

async function testRollbackGate(root: string): Promise<void> {
  await runMainline(root);
  await requestRollback(root, "stage_3_content", "stage_2_components", "acceptance-test");
  try {
    await assert.rejects(
      () => runMainline(root),
      /存在未解决的回退记录/
    );
  } finally {
    await resolveRollback(root, "stage_3_content");
  }
  await runMainline(root);
}

async function testMainlineRequiresExternalCandidate(root: string): Promise<void> {
  const stage1 = stageFiles(root, "stage_1_skeleton");
  const originalCandidate = await readFile(stage1.candidate, "utf8");
  try {
    await unlink(stage1.candidate);
    await assert.rejects(
      () => runMainline(root),
      /candidate\.page\.json/
    );
  } finally {
    await writeFile(stage1.candidate, originalCandidate.endsWith("\n") ? originalCandidate : `${originalCandidate}\n`, "utf8");
  }
}

async function main(): Promise<void> {
  const root = projectRoot();
  await testStageWriteGuard(root);
  await testRequiredDocsExist(root);
  await testCatalogDynamicLoad(root);
  await testRollbackGate(root);
  await testMainlineRequiresExternalCandidate(root);
  console.log("acceptance passed");
}

main().catch((err) => {
  const reason = err instanceof Error ? err.message : String(err);
  console.error(reason);
  process.exit(1);
});
