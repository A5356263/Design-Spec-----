import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateCandidateFile } from "./evaluate";
import { freezeStage } from "./freeze";
import { hasUnresolvedRollback } from "./rollback";
import { PageSchema, StageName, STAGE_DIR } from "./schema";

type RuntimeState = {
  current_stage: StageName | "completed";
  last_passed_stage: StageName | null;
  can_advance: boolean;
};

export function stageFiles(projectRoot: string, stageName: StageName): Record<string, string> {
  const base = path.join(projectRoot, STAGE_DIR[stageName]);
  return {
    base,
    candidate: path.join(base, "candidate.page.json"),
    approved: path.join(base, "approved.page.json"),
    evaluation: path.join(base, "evaluation.md")
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, "")) as T;
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readRuntimeState(projectRoot: string): Promise<RuntimeState> {
  return readJson<RuntimeState>(path.join(projectRoot, "workdir/runtime/state.json"));
}

async function assertHardGate(projectRoot: string, stageName: StageName): Promise<void> {
  if (stageName === "stage_2_components") {
    const prevApproved = stageFiles(projectRoot, "stage_1_skeleton").approved;
    if (!(await exists(prevApproved))) {
      throw new Error("硬卡口失败：阶段二启动前缺少 stage_1_skeleton/approved.page.json。");
    }
  }
  if (stageName === "stage_3_content") {
    const prevApproved = stageFiles(projectRoot, "stage_2_components").approved;
    if (!(await exists(prevApproved))) {
      throw new Error("硬卡口失败：阶段三启动前缺少 stage_2_components/approved.page.json。");
    }
  }
}

async function appendRunLog(projectRoot: string, message: string): Promise<void> {
  const runLogPath = path.join(projectRoot, "workdir/runtime/run_log.md");
  const oldLog = await readFile(runLogPath, "utf8");
  const now = new Date().toISOString();
  await writeFile(runLogPath, `${oldLog.trimEnd()}\n- [${now}] ${message}\n`, "utf8");
}

async function waitForAgentArtifacts(projectRoot: string, stageName: StageName): Promise<boolean> {
  const files = stageFiles(projectRoot, stageName);
  const hasCandidate = await exists(files.candidate);
  const hasEvaluation = await exists(files.evaluation);
  if (!hasCandidate || !hasEvaluation) {
    const missing = [
      !hasCandidate ? "candidate.page.json" : "",
      !hasEvaluation ? "evaluation.md" : ""
    ].filter(Boolean).join(" 和 ");
    await appendRunLog(projectRoot, `${stageName} 等待 Code Agent 产物：${missing}。`);
    return false;
  }
  return true;
}

function parseAgentEvaluation(raw: string): boolean {
  const normalized = raw.replace(/^\uFEFF/, "");
  const match = normalized.match(/是否通过[:：]\s*(通过|不通过)/);
  if (!match) {
    throw new Error("硬卡口失败：evaluation.md 缺少“是否通过：通过 / 不通过”字段。");
  }
  return match[1] === "通过";
}

async function verifyInputReadonly(projectRoot: string, snapshots: Record<string, string>): Promise<void> {
  for (const [filePath, oldContent] of Object.entries(snapshots)) {
    const now = await readFile(path.join(projectRoot, filePath), "utf8");
    if (now !== oldContent) {
      throw new Error(`硬卡口失败：input 文件被改写 (${filePath})。`);
    }
  }
}

async function collectInputSnapshots(projectRoot: string): Promise<Record<string, string>> {
  const files = ["input/design_spec.md", "input/constraints.md", "input/references.md"];
  const snapshots: Record<string, string> = {};
  for (const rel of files) {
    const full = path.join(projectRoot, rel);
    if (await exists(full)) {
      snapshots[rel] = await readFile(full, "utf8");
    }
  }
  return snapshots;
}

async function finalize(projectRoot: string): Promise<void> {
  const stage3 = stageFiles(projectRoot, "stage_3_content");
  if (!(await exists(stage3.approved))) {
    throw new Error("无法生成 final：缺少 stage_3_content/approved.page.json。");
  }
  if (await hasUnresolvedRollback(projectRoot)) {
    throw new Error("无法生成 final：存在未解决的回退记录。");
  }
  const finalPage = await readJson<PageSchema>(stage3.approved);
  await writeJson(path.join(projectRoot, "workdir/workspace/final/final.page.json"), finalPage);
  const summary = [
    "# Final Summary",
    "",
    "- 主链路执行完成：阶段一、阶段二、阶段三全部通过并冻结。",
    "- 最终产物来源：workdir/workspace/stage_3_content/approved.page.json"
  ].join("\n");
  await writeFile(path.join(projectRoot, "workdir/workspace/final/final-summary.md"), `${summary}\n`, "utf8");
}

export async function runMainline(projectRoot = process.cwd()): Promise<void> {
  if (await hasUnresolvedRollback(projectRoot)) {
    throw new Error("无法推进主链路：存在未解决的回退记录。");
  }
  const inputSnapshots = await collectInputSnapshots(projectRoot);
  await appendRunLog(projectRoot, "主链路开始执行。");

  while (true) {
    const state = await readRuntimeState(projectRoot);
    if (state.current_stage === "completed") {
      await finalize(projectRoot);
      await appendRunLog(projectRoot, "final.page.json 已汇总完成。");
      await verifyInputReadonly(projectRoot, inputSnapshots);
      return;
    }

    const stageName = state.current_stage;
    await assertHardGate(projectRoot, stageName);
    if (!(await waitForAgentArtifacts(projectRoot, stageName))) {
      await verifyInputReadonly(projectRoot, inputSnapshots);
      return;
    }
    const files = stageFiles(projectRoot, stageName);
    await appendRunLog(projectRoot, `${stageName} 检测到 candidate.page.json 与 evaluation.md，开始处理。`);

    const previousApproved =
      stageName === "stage_1_skeleton"
        ? undefined
        : stageName === "stage_2_components"
          ? stageFiles(projectRoot, "stage_1_skeleton").approved
          : stageFiles(projectRoot, "stage_2_components").approved;

    const hardGate = await evaluateCandidateFile(projectRoot, stageName, files.candidate, previousApproved);
    if (!hardGate.passed) {
      await appendRunLog(projectRoot, `${stageName} 硬门卡不通过，主链路停止。`);
      await verifyInputReadonly(projectRoot, inputSnapshots);
      return;
    }

    const evaluationPassed = parseAgentEvaluation(await readFile(files.evaluation, "utf8"));
    if (!evaluationPassed) {
      await appendRunLog(projectRoot, `${stageName} Agent 评估为不通过，停留当前阶段。`);
      await verifyInputReadonly(projectRoot, inputSnapshots);
      return;
    }

    await freezeStage(projectRoot, stageName);
  }
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath && fileURLToPath(import.meta.url) === entryPath) {
  runMainline().catch((err) => {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(reason);
    process.exit(1);
  });
}
