import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { StageName, STAGE_DIR } from "./schema";

export type RuntimeState = {
  current_stage: StageName | "completed";
  last_passed_stage: StageName | null;
  can_advance: boolean;
};

export type CurrentRun = {
  run_id: string;
};

export type RunContext = {
  runId: string;
  runRoot: string;
  runtimeDir: string;
  workspaceDir: string;
  snapshotsDir: string;
  statePath: string;
  runLogPath: string;
  finalDir: string;
};

function parseJson<T>(raw: string): T {
  return JSON.parse(raw.replace(/^\uFEFF/, "")) as T;
}

function formatDatePart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatTimePart(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}${minutes}${seconds}`;
}

export function getWorkdirRoot(projectRoot: string): string {
  return path.join(projectRoot, "workdir");
}

export function getCurrentRunFile(projectRoot: string): string {
  return path.join(getWorkdirRoot(projectRoot), "current_run.json");
}

export function getRunsRoot(projectRoot: string): string {
  return path.join(getWorkdirRoot(projectRoot), "runs");
}

export function getRunContext(projectRoot: string, runId: string): RunContext {
  const runRoot = path.join(getRunsRoot(projectRoot), runId);
  const runtimeDir = path.join(runRoot, "runtime");
  const workspaceDir = path.join(runRoot, "workspace");
  return {
    runId,
    runRoot,
    runtimeDir,
    workspaceDir,
    snapshotsDir: path.join(runtimeDir, "snapshots"),
    statePath: path.join(runtimeDir, "state.json"),
    runLogPath: path.join(runtimeDir, "run_log.md"),
    finalDir: path.join(workspaceDir, "final")
  };
}

export function getStageDir(workspaceDir: string, stageName: StageName): string {
  return path.join(workspaceDir, STAGE_DIR[stageName]);
}

export function getStageFiles(
  context: RunContext,
  stageName: StageName
): Record<"base" | "candidate" | "approved" | "evaluation" | "meta", string> {
  const base = getStageDir(context.workspaceDir, stageName);
  return {
    base,
    candidate: path.join(base, "candidate.page.json"),
    approved: path.join(base, "approved.page.json"),
    evaluation: path.join(base, "evaluation.md"),
    meta: path.join(base, "meta.json")
  };
}

export async function readCurrentRun(projectRoot: string): Promise<CurrentRun> {
  const raw = await readFile(getCurrentRunFile(projectRoot), "utf8");
  return parseJson<CurrentRun>(raw);
}

export async function resolveCurrentRun(projectRoot: string): Promise<RunContext> {
  const current = await readCurrentRun(projectRoot);
  if (!current.run_id || typeof current.run_id !== "string") {
    throw new Error("缺少有效的 workdir/current_run.json。");
  }
  return getRunContext(projectRoot, current.run_id);
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createInitialState(): RuntimeState {
  return {
    current_stage: "stage_1_skeleton",
    last_passed_stage: null,
    can_advance: true
  };
}

function createStageMeta(stageName: StageName): Record<string, unknown> {
  return {
    stage: stageName,
    status: "pending",
    evaluation_passed: false,
    updated_at: null
  };
}

export function generateRunId(now = new Date()): string {
  const millis = String(now.getMilliseconds()).padStart(3, "0");
  return `run_${formatDatePart(now)}_${formatTimePart(now)}_${millis}`;
}

export async function createNewRun(projectRoot: string, runId = generateRunId()): Promise<RunContext> {
  const context = getRunContext(projectRoot, runId);

  await mkdir(context.runtimeDir, { recursive: true });
  await mkdir(context.workspaceDir, { recursive: true });
  await mkdir(context.snapshotsDir, { recursive: true });
  await mkdir(context.finalDir, { recursive: true });

  for (const stageName of Object.keys(STAGE_DIR) as StageName[]) {
    const stageDir = getStageDir(context.workspaceDir, stageName);
    await mkdir(stageDir, { recursive: true });
    await writeJson(path.join(stageDir, "meta.json"), createStageMeta(stageName));
  }

  await writeJson(context.statePath, createInitialState());
  await writeFile(context.runLogPath, "# Run Log\n\n- 项目初始化完成。\n", "utf8");
  await writeJson(getCurrentRunFile(projectRoot), { run_id: runId });
  return context;
}
