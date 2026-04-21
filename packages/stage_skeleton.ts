import { AgentArtifacts, runDocumentAgent } from "./document-agent";

export async function buildSkeletonStage(projectRoot: string): Promise<AgentArtifacts> {
  return runDocumentAgent(projectRoot, "stage_1_skeleton", null);
}
