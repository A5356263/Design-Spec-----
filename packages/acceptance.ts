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

async function readStageOutput(root: string, stageName: string): Promise<string> {
  return readFile(path.join(root, `workdir/workspace/${stageName}/approved.page.json`), "utf8");
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

async function testDesignSpecDrivesGeneration(root: string): Promise<void> {
  const designSpecPath = path.join(root, "input/design_spec.md");
  const original = await readFile(designSpecPath, "utf8");

  const alternative = [
    "# 设计说明",
    "# 页面需求：设备借用申请创建页",
    "",
    "## 页面目标",
    "创建一个企业内部使用的设备借用申请页面。",
    "",
    "## 页面整体布局",
    "页面采用三段结构：",
    "1. 顶部标题与操作区",
    "2. 中间主体区，采用左右布局",
    "3. 底部提交操作区",
    "",
    "## 顶部标题与操作区",
    "- 页面标题：设备借用申请",
    "- 页面说明：用于提交设备借用申请",
    "- 状态标签：待填写",
    "- 操作按钮：",
    "  - 保存草稿",
    "  - 提交申请",
    "",
    "## 左侧主要填写区",
    "### 模块一：申请信息",
    "- 申请单编号",
    "- 申请人",
    "- 借用部门",
    "",
    "### 模块二：借用清单",
    "使用表格展示借用设备。",
    "表格列固定为：",
    "- 设备名称",
    "- 数量",
    "- 借用日期",
    "",
    "## 右侧辅助信息区",
    "### 卡片一：借用规则",
    "- 设备归还前不得重复申请",
    "- 高价值设备需主管审批",
    "",
    "### 卡片二：库存摘要",
    "- 可借设备：12",
    "- 待归还设备：3",
    "",
    "## 底部操作区",
    "- 取消",
    "- 提交申请",
    "",
    "## 三阶段要求",
    "### 阶段一：骨架阶段",
    "- 只生成布局与模块容器",
    "### 阶段二：组件阶段",
    "- 补齐表格、按钮、状态标签",
    "### 阶段三：内容阶段",
    "- 补齐静态内容与示例信息"
  ].join("\n");

  try {
    await runMainline(root);
    const beforeStage1 = await readStageOutput(root, "stage_1_skeleton");
    const beforeStage2 = await readStageOutput(root, "stage_2_components");
    const beforeStage3 = await readStageOutput(root, "stage_3_content");

    await writeFile(designSpecPath, `${alternative}\n`, "utf8");
    await runMainline(root);

    const afterStage1 = await readStageOutput(root, "stage_1_skeleton");
    const afterStage2 = await readStageOutput(root, "stage_2_components");
    const afterStage3 = await readStageOutput(root, "stage_3_content");

    assert.notEqual(beforeStage1, afterStage1, "更换 design_spec 后阶段一产物应变化");
    assert.notEqual(beforeStage2, afterStage2, "更换 design_spec 后阶段二产物应变化");
    assert.notEqual(beforeStage3, afterStage3, "更换 design_spec 后阶段三产物应变化");
    assert.equal(afterStage1.includes("demo-"), false, "阶段产物中不应残留固定 demo 命名");
    const promptPath = path.join(root, "workdir/workspace/stage_1_skeleton/agent-prompt.md");
    const prompt = await readFile(promptPath, "utf8");
    assert.equal(prompt.includes("不要套用固定页面模板"), true, "阶段目录中应落盘 Agent 提示");
  } finally {
    await writeFile(designSpecPath, original.endsWith("\n") ? original : `${original}\n`, "utf8");
    await runMainline(root);
  }
}

async function main(): Promise<void> {
  const root = projectRoot();
  await testStageWriteGuard(root);
  await testCatalogDynamicLoad(root);
  await testRollbackGate(root);
  await testDesignSpecDrivesGeneration(root);
  console.log("acceptance passed");
}

main().catch((err) => {
  const reason = err instanceof Error ? err.message : String(err);
  console.error(reason);
  process.exit(1);
});
