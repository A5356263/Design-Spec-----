export type StageName = "stage_1_skeleton" | "stage_2_components" | "stage_3_content";
export type CatalogStage = "skeleton" | "components" | "content";

export type PageNode = {
  type: string;
  props: Record<string, unknown>;
  children: string[];
};

export type PageSchema = {
  root: string;
  elements: Record<string, PageNode>;
};

export type EvaluationResult = {
  passed: boolean;
  issues: string[];
  instructions: string[];
};

export const MAINLINE_ORDER: StageName[] = [
  "stage_1_skeleton",
  "stage_2_components",
  "stage_3_content"
];

export const STAGE_DIR: Record<StageName, string> = {
  stage_1_skeleton: "stage_1_skeleton",
  stage_2_components: "stage_2_components",
  stage_3_content: "stage_3_content"
};

export const TYPE_RULES: Record<string, { stage: CatalogStage[]; props: string[] }> = {
  Flex: { stage: ["skeleton", "components", "content"], props: ["direction", "gap", "align", "justify", "wrap", "width"] },
  Space: { stage: ["skeleton", "components", "content"], props: ["direction", "size", "align", "gap"] },
  Divider: { stage: ["skeleton", "components", "content"], props: ["orientation"] },
  Card: { stage: ["skeleton", "components", "content"], props: ["title", "padding", "gap", "width"] },
  TypographyText: { stage: ["skeleton", "components", "content"], props: ["text", "level", "emphasis"] },
  Skeleton: { stage: ["skeleton", "components", "content"], props: ["active", "rows"] },
  Button: { stage: ["components", "content"], props: ["label", "variant", "size", "disabled"] },
  Input: { stage: ["components", "content"], props: ["placeholder", "value", "disabled"] },
  Select: { stage: ["components", "content"], props: ["options", "value", "placeholder", "disabled"] },
  Form: { stage: ["components", "content"], props: ["layout", "disabled"] },
  Table: { stage: ["components", "content"], props: ["columns", "rows", "size", "bordered", "width"] },
  Descriptions: { stage: ["components", "content"], props: ["items", "columns", "size", "gap"] },
  Segmented: { stage: ["components", "content"], props: ["options", "value", "size", "block"] },
  Tabs: { stage: ["components", "content"], props: ["items", "activeKey"] },
  Alert: { stage: ["components", "content"], props: ["message", "description", "tone", "showGlyph"] },
  Tag: { stage: ["components", "content"], props: ["label", "tone", "size"] },
  Breadcrumb: { stage: ["components", "content"], props: ["items"] },
  Statistic: { stage: ["content"], props: ["title", "value", "prefix", "trend"] },
  Timeline: { stage: ["content"], props: ["items", "mode"] },
  Progress: { stage: ["content"], props: ["percent", "status", "size", "label", "width"] },
  List: { stage: ["content"], props: ["items", "size", "bordered", "gap"] },
  Empty: { stage: ["content"], props: ["description"] }
};

export function toCatalogStage(stageName: StageName): CatalogStage {
  if (stageName === "stage_1_skeleton") return "skeleton";
  if (stageName === "stage_2_components") return "components";
  return "content";
}

export function getNextStage(stage: StageName): StageName | null {
  const idx = MAINLINE_ORDER.indexOf(stage);
  if (idx < 0 || idx === MAINLINE_ORDER.length - 1) return null;
  return MAINLINE_ORDER[idx + 1];
}
