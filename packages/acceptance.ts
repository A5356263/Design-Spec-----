import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateCandidateFile } from "./evaluate";
import { runMainline } from "./mainline";
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
  const catalogPath = path.join(root, "config/ANT_LITE_CATALOG.json");
  const stageDir = path.join(root, "workdir/workspace/stage_2_components");
  const candidatePath = path.join(stageDir, "candidate.page.json");
  const evaluationPath = path.join(stageDir, "evaluation.md");

  const candidate = {
    root: "root",
    elements: {
      root: { type: "Flex", props: { direction: "vertical" }, children: ["btn"] },
      btn: { type: "Button", props: { label: "提交", variant: "primary" }, children: [] }
    }
  };
  await writeFile(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");

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

async function testRollbackGate(root: string): Promise<void> {
  await runMainline(root);
  await requestRollback(root, "stage_3_content", "stage_2_components", "acceptance-test");

  await assert.rejects(
    () => runMainline(root),
    /存在未解决的回退记录/
  );

  await resolveRollback(root, "stage_3_content");
  await runMainline(root);
}

async function main(): Promise<void> {
  const root = projectRoot();
  await testStageWriteGuard(root);
  await testCatalogDynamicLoad(root);
  await testRollbackGate(root);
  console.log("acceptance passed");
}

main().catch((err) => {
  const reason = err instanceof Error ? err.message : String(err);
  console.error(reason);
  process.exit(1);
});
