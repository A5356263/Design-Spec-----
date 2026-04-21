import { writeFile } from "node:fs/promises";
import path from "node:path";
import { StageName, STAGE_DIR } from "./schema";

function normalize(input: string): string {
  return path.resolve(input).toLowerCase();
}

function isInDir(filePath: string, dirPath: string): boolean {
  const file = normalize(filePath);
  const dir = normalize(dirPath);
  return file === dir || file.startsWith(`${dir}${path.sep}`);
}

export async function writeStageFile(
  projectRoot: string,
  stageName: StageName,
  targetFile: string,
  content: string
): Promise<void> {
  const stageDir = path.join(projectRoot, STAGE_DIR[stageName]);
  if (!isInDir(targetFile, stageDir)) {
    throw new Error(`硬卡口失败：阶段 ${stageName} 只能写入 ${STAGE_DIR[stageName]} 目录。`);
  }
  await writeFile(targetFile, content, "utf8");
}
