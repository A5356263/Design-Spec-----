import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getNextStage, StageName, STAGE_DIR } from "./schema";
import { writeStageFile } from "./stage-guard";

type RuntimeState = {
  current_stage: StageName | "completed";
  last_passed_stage: StageName | null;
  can_advance: boolean;
};

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
  const stageDir = path.join(projectRoot, STAGE_DIR[stageName]);
  const candidatePath = path.join(stageDir, "candidate.page.json");
  const approvedPath = path.join(stageDir, "approved.page.json");
  const metaPath = path.join(stageDir, "meta.json");
  const runtimeStatePath = path.join(projectRoot, "workdir/runtime/state.json");
  const runLogPath = path.join(projectRoot, "workdir/runtime/run_log.md");

  const candidateRaw = await readFile(candidatePath, "utf8");
  await writeStageFile(projectRoot, stageName, approvedPath, candidateRaw.endsWith("\n") ? candidateRaw : `${candidateRaw}\n`);
  await updateMeta(projectRoot, metaPath, stageName);

  const stateRaw = await readFile(runtimeStatePath, "utf8");
  const state = parseJson<RuntimeState>(stateRaw);
  const next = getNextStage(stageName);
  state.last_passed_stage = stageName;
  state.current_stage = next ?? "completed";
  state.can_advance = Boolean(next);
  await writeFile(runtimeStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const now = new Date().toISOString();
  const oldLog = await readFile(runLogPath, "utf8");
  const newLog = `${oldLog.trimEnd()}\n- [${now}] ${stageName} 评估通过并已冻结。\n`;
  await writeFile(runLogPath, newLog, "utf8");
}
