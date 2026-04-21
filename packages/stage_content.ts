import { AgentArtifacts, runDocumentAgent } from "./document-agent";
import { PageSchema } from "./schema";

export async function buildContentStage(projectRoot: string, stage2Approved: PageSchema): Promise<AgentArtifacts> {
  return runDocumentAgent(projectRoot, "stage_3_content", stage2Approved);
}
