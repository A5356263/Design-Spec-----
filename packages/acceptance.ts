import assert from "node:assert/strict";
import { access, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateCandidateFile } from "./evaluate";
import { runMainline } from "./mainline";
import { requestRollback, resolveRollback } from "./rollback";
import { createNewRun, getCurrentRunFile, getStageFiles, readCurrentRun, resolveCurrentRun } from "./run-context";
import { writeStageFile } from "./stage-guard";

function projectRoot(): string {
  return process.cwd();
}

async function testStageWriteGuard(root: string): Promise<void> {
  const currentRun = await resolveCurrentRun(root);
  const invalidTarget = path.join(currentRun.runtimeDir, "illegal-write.txt");
  await assert.rejects(
    () => writeStageFile(root, "stage_1_skeleton", invalidTarget, "x\n"),
    /硬卡口失败/
  );
}

async function testCatalogDynamicLoad(root: string): Promise<void> {
  await runMainline(root);
  const currentRun = await resolveCurrentRun(root);
  const catalogPath = path.join(root, "config/ANT_LITE_CATALOG.json");
  const candidatePath = getStageFiles(currentRun, "stage_2_components").candidate;

  const oldCatalogRaw = await readFile(catalogPath, "utf8");
  const catalog = JSON.parse(oldCatalogRaw.replace(/^\uFEFF/, ""));

  try {
    delete catalog.types.Button;
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    const failResult = await evaluateCandidateFile(root, "stage_2_components", candidatePath);
    assert.equal(failResult.passed, false, "移除 Button 后评估应失败");
  } finally {
    await writeFile(catalogPath, oldCatalogRaw.endsWith("\n") ? oldCatalogRaw : `${oldCatalogRaw}\n`, "utf8");
  }

  const passResult = await evaluateCandidateFile(root, "stage_2_components", candidatePath);
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
  const currentRun = await resolveCurrentRun(root);
  const stage1 = getStageFiles(currentRun, "stage_1_skeleton");
  const statePath = currentRun.statePath;
  const originalCandidate = await readFile(stage1.candidate, "utf8");
  const originalState = await readFile(statePath, "utf8");
  try {
    await writeFile(statePath, `${JSON.stringify({
      current_stage: "stage_1_skeleton",
      last_passed_stage: null,
      can_advance: true
    }, null, 2)}\n`, "utf8");
    await unlink(stage1.candidate);
    await runMainline(root);
    const nextState = JSON.parse((await readFile(statePath, "utf8")).replace(/^\uFEFF/, ""));
    assert.equal(nextState.current_stage, "stage_1_skeleton", "缺少 candidate 时应停留在当前阶段等待");
  } finally {
    await writeFile(statePath, originalState.endsWith("\n") ? originalState : `${originalState}\n`, "utf8");
    await writeFile(stage1.candidate, originalCandidate.endsWith("\n") ? originalCandidate : `${originalCandidate}\n`, "utf8");
  }
}

async function testMainlineRequiresExternalEvaluation(root: string): Promise<void> {
  const currentRun = await resolveCurrentRun(root);
  const stage1 = getStageFiles(currentRun, "stage_1_skeleton");
  const statePath = currentRun.statePath;
  const originalEvaluation = await readFile(stage1.evaluation, "utf8");
  const originalState = await readFile(statePath, "utf8");
  try {
    await writeFile(statePath, `${JSON.stringify({
      current_stage: "stage_1_skeleton",
      last_passed_stage: null,
      can_advance: true
    }, null, 2)}\n`, "utf8");
    await unlink(stage1.evaluation);
    await runMainline(root);
    const nextState = JSON.parse((await readFile(statePath, "utf8")).replace(/^\uFEFF/, ""));
    assert.equal(nextState.current_stage, "stage_1_skeleton", "缺少 evaluation 时应停留在当前阶段等待");
  } finally {
    await writeFile(statePath, originalState.endsWith("\n") ? originalState : `${originalState}\n`, "utf8");
    await writeFile(stage1.evaluation, originalEvaluation.endsWith("\n") ? originalEvaluation : `${originalEvaluation}\n`, "utf8");
  }
}

async function testAgentEvaluationControlsAdvance(root: string): Promise<void> {
  const currentRun = await resolveCurrentRun(root);
  const stage1 = getStageFiles(currentRun, "stage_1_skeleton");
  const statePath = currentRun.statePath;
  const originalEvaluation = await readFile(stage1.evaluation, "utf8");
  const originalState = await readFile(statePath, "utf8");
  try {
    await writeFile(statePath, `${JSON.stringify({
      current_stage: "stage_1_skeleton",
      last_passed_stage: null,
      can_advance: true
    }, null, 2)}\n`, "utf8");
    await writeFile(stage1.evaluation, [
      "# 评估结果",
      "",
      "是否通过：不通过",
      "",
      "## 问题",
      "1. 外部 Agent 判定当前阶段未完成。",
      "",
      "## 修改指令",
      "1. 继续修复当前阶段。"
    ].join("\n") + "\n", "utf8");
    await runMainline(root);
    const nextState = JSON.parse((await readFile(statePath, "utf8")).replace(/^\uFEFF/, ""));
    assert.equal(nextState.current_stage, "stage_1_skeleton", "Agent 评估不通过时不应推进阶段");
  } finally {
    await writeFile(statePath, originalState.endsWith("\n") ? originalState : `${originalState}\n`, "utf8");
    await writeFile(stage1.evaluation, originalEvaluation.endsWith("\n") ? originalEvaluation : `${originalEvaluation}\n`, "utf8");
  }
}

async function testCreateNewRunIsolation(root: string): Promise<void> {
  const original = await readCurrentRun(root);
  const originalRunId = original.run_id;
  const originalContext = await resolveCurrentRun(root);
  const originalFinal = path.join(originalContext.finalDir, "final.page.json");
  await access(originalFinal);

  const newRunId = `run_acceptance_${Date.now()}`;
  const newRun = await createNewRun(root, newRunId);

  try {
    const current = await readCurrentRun(root);
    assert.equal(current.run_id, newRunId, "新建 run 后 current_run.json 应切换到新 run");

    const state = JSON.parse((await readFile(newRun.statePath, "utf8")).replace(/^\uFEFF/, ""));
    assert.equal(state.current_stage, "stage_1_skeleton", "新 run 应从阶段一开始");

    const stage1Meta = JSON.parse((await readFile(getStageFiles(newRun, "stage_1_skeleton").meta, "utf8")).replace(/^\uFEFF/, ""));
    assert.equal(stage1Meta.status, "pending", "新 run 的阶段元数据应初始化为 pending");

    await access(originalFinal);
  } finally {
    await writeFile(getCurrentRunFile(root), `${JSON.stringify({ run_id: originalRunId }, null, 2)}\n`, "utf8");
    await rm(newRun.runRoot, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const root = projectRoot();
  await testCreateNewRunIsolation(root);
  await testStageWriteGuard(root);
  await testRequiredDocsExist(root);
  await testCatalogDynamicLoad(root);
  await testRollbackGate(root);
  await testMainlineRequiresExternalCandidate(root);
  await testMainlineRequiresExternalEvaluation(root);
  await testAgentEvaluationControlsAdvance(root);
  console.log("acceptance passed");
}

main().catch((err) => {
  const reason = err instanceof Error ? err.message : String(err);
  console.error(reason);
  process.exit(1);
});
