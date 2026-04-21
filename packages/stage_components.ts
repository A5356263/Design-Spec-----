import { AgentArtifacts, runDocumentAgent } from "./document-agent";
import { PageSchema } from "./schema";

export async function buildComponentsStage(projectRoot: string, stage1Approved: PageSchema): Promise<AgentArtifacts> {
  return runDocumentAgent(projectRoot, "stage_2_components", stage1Approved);
}
