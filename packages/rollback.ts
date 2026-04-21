import { readFile, writeFile } from "node:fs/promises";
import { getStageFiles, resolveCurrentRun } from "./run-context";
import { MAINLINE_ORDER, StageName } from "./schema";

type RollbackInfo = {
  from: StageName;
  to: StageName;
  reason: string;
  at: string;
  resolved: boolean;
};

export async function requestRollback(
  projectRoot: string,
  currentStage: StageName,
  targetStage: StageName,
  reason: string
): Promise<void> {
  const currentRun = await resolveCurrentRun(projectRoot);
  const now = new Date().toISOString();
  const metaPath = getStageFiles(currentRun, currentStage).meta;

  const metaRaw = await readFile(metaPath, "utf8");
  const meta = JSON.parse(metaRaw.replace(/^\uFEFF/, ""));
  const rollback: RollbackInfo = { from: currentStage, to: targetStage, reason, at: now, resolved: false };
  meta.rollback = rollback;
  meta.status = "rollback_requested";
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  const stateRaw = await readFile(currentRun.statePath, "utf8");
  const state = JSON.parse(stateRaw.replace(/^\uFEFF/, ""));
  state.current_stage = targetStage;
  state.can_advance = false;
  await writeFile(currentRun.statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const oldLog = await readFile(currentRun.runLogPath, "utf8");
  const line = `- [${now}] ROLLBACK ${currentStage} -> ${targetStage}，原因：${reason}。`;
  await writeFile(currentRun.runLogPath, `${oldLog.trimEnd()}\n${line}\n`, "utf8");
}

export async function resolveRollback(projectRoot: string, stageName: StageName): Promise<void> {
  const currentRun = await resolveCurrentRun(projectRoot);
  const now = new Date().toISOString();
  const metaPath = getStageFiles(currentRun, stageName).meta;
  const metaRaw = await readFile(metaPath, "utf8");
  const meta = JSON.parse(metaRaw.replace(/^\uFEFF/, ""));
  if (!meta.rollback) {
    return;
  }
  meta.rollback.resolved = true;
  meta.status = "approved";
  meta.updated_at = now;
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  const oldLog = await readFile(currentRun.runLogPath, "utf8");
  const line = `- [${now}] ROLLBACK_RESOLVED ${stageName}。`;
  await writeFile(currentRun.runLogPath, `${oldLog.trimEnd()}\n${line}\n`, "utf8");
}

export async function hasUnresolvedRollback(projectRoot: string): Promise<boolean> {
  const currentRun = await resolveCurrentRun(projectRoot);
  for (const stageName of MAINLINE_ORDER) {
    const metaPath = getStageFiles(currentRun, stageName).meta;
    const raw = await readFile(metaPath, "utf8");
    const meta = JSON.parse(raw.replace(/^\uFEFF/, ""));
    if (meta.rollback && meta.rollback.resolved === false) {
      return true;
    }
  }
  return false;
}
