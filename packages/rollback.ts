import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAINLINE_ORDER, StageName, STAGE_DIR } from "./schema";

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
  const now = new Date().toISOString();
  const metaPath = path.join(projectRoot, STAGE_DIR[currentStage], "meta.json");
  const statePath = path.join(projectRoot, "workdir/runtime/state.json");
  const runLogPath = path.join(projectRoot, "workdir/runtime/run_log.md");

  const metaRaw = await readFile(metaPath, "utf8");
  const meta = JSON.parse(metaRaw.replace(/^\uFEFF/, ""));
  const rollback: RollbackInfo = { from: currentStage, to: targetStage, reason, at: now, resolved: false };
  meta.rollback = rollback;
  meta.status = "rollback_requested";
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  const stateRaw = await readFile(statePath, "utf8");
  const state = JSON.parse(stateRaw.replace(/^\uFEFF/, ""));
  state.current_stage = targetStage;
  state.can_advance = false;
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const oldLog = await readFile(runLogPath, "utf8");
  const line = `- [${now}] ROLLBACK ${currentStage} -> ${targetStage}，原因：${reason}。`;
  await writeFile(runLogPath, `${oldLog.trimEnd()}\n${line}\n`, "utf8");
}

export async function resolveRollback(projectRoot: string, stageName: StageName): Promise<void> {
  const now = new Date().toISOString();
  const metaPath = path.join(projectRoot, STAGE_DIR[stageName], "meta.json");
  const runLogPath = path.join(projectRoot, "workdir/runtime/run_log.md");
  const metaRaw = await readFile(metaPath, "utf8");
  const meta = JSON.parse(metaRaw.replace(/^\uFEFF/, ""));
  if (!meta.rollback) {
    return;
  }
  meta.rollback.resolved = true;
  meta.status = "approved";
  meta.updated_at = now;
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  const oldLog = await readFile(runLogPath, "utf8");
  const line = `- [${now}] ROLLBACK_RESOLVED ${stageName}。`;
  await writeFile(runLogPath, `${oldLog.trimEnd()}\n${line}\n`, "utf8");
}

export async function hasUnresolvedRollback(projectRoot: string): Promise<boolean> {
  for (const stageName of MAINLINE_ORDER) {
    const metaPath = path.join(projectRoot, STAGE_DIR[stageName], "meta.json");
    const raw = await readFile(metaPath, "utf8");
    const meta = JSON.parse(raw.replace(/^\uFEFF/, ""));
    if (meta.rollback && meta.rollback.resolved === false) {
      return true;
    }
  }
  return false;
}
