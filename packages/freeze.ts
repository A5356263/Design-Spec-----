import { readFile, writeFile } from "node:fs/promises";
import { getCurrentRunFile, getStageFiles, resolveCurrentRun, RuntimeState } from "./run-context";
import { getNextStage, StageName } from "./schema";
import { writeStageFile } from "./stage-guard";

export function canFreeze(evaluationPassed: boolean): boolean {
  return evaluationPassed;
}

async function updateMeta(projectRoot: string, metaPath: string, stageName: StageName): Promise<void> {
  const now = new Date().toISOString();
  const oldRaw = await readFile(metaPath, "utf8");
  const old = parseJson<Record<string, unknown>>(oldRaw);
  const content: Record<string, unknown> = {
    ...old,
    stage: stageName,
    status: "approved",
    evaluation_passed: true,
    updated_at: now
  };
  await writeStageFile(projectRoot, stageName, metaPath, `${JSON.stringify(content, null, 2)}\n`);
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw.replace(/^\uFEFF/, "")) as T;
}

export async function freezeStage(projectRoot: string, stageName: StageName): Promise<void> {
  const currentRun = await resolveCurrentRun(projectRoot);
  const stage = getStageFiles(currentRun, stageName);
  const currentRunFile = getCurrentRunFile(projectRoot);

  const candidateRaw = await readFile(stage.candidate, "utf8");
  await writeStageFile(projectRoot, stageName, stage.approved, candidateRaw.endsWith("\n") ? candidateRaw : `${candidateRaw}\n`);
  await updateMeta(projectRoot, stage.meta, stageName);

  const latestRunRaw = await readFile(currentRunFile, "utf8");
  const latestRun = parseJson<{ run_id: string }>(latestRunRaw);
  if (latestRun.run_id !== currentRun.runId) {
    throw new Error(`硬卡口失败：当前 run 已切换，禁止向旧 run ${currentRun.runId} 冻结。`);
  }

  const stateRaw = await readFile(currentRun.statePath, "utf8");
  const state = parseJson<RuntimeState>(stateRaw);
  const next = getNextStage(stageName);
  state.last_passed_stage = stageName;
  state.current_stage = next ?? "completed";
  state.can_advance = Boolean(next);
  await writeFile(currentRun.statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const now = new Date().toISOString();
  const oldLog = await readFile(currentRun.runLogPath, "utf8");
  const newLog = `${oldLog.trimEnd()}\n- [${now}] ${stageName} 评估通过并已冻结。\n`;
  await writeFile(currentRun.runLogPath, newLog, "utf8");
}
