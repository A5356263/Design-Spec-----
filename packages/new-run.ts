import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNewRun } from "./run-context";

function parseRunIdArg(argv: string[]): string | undefined {
  const idx = argv.indexOf("--run-id");
  if (idx >= 0) {
    return argv[idx + 1];
  }
  const first = argv[0];
  if (first && !first.startsWith("-")) {
    return first;
  }
  return undefined;
}

async function main(): Promise<void> {
  const runId = parseRunIdArg(process.argv.slice(2));
  const context = await createNewRun(process.cwd(), runId);
  console.log(`current run: ${context.runId}`);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath && fileURLToPath(import.meta.url) === entryPath) {
  main().catch((err) => {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(reason);
    process.exit(1);
  });
}
