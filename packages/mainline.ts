export type StageName = "stage_1_skeleton" | "stage_2_components" | "stage_3_content";

export const MAINLINE_ORDER: StageName[] = [
  "stage_1_skeleton",
  "stage_2_components",
  "stage_3_content"
];

export function getNextStage(stage: StageName): StageName | null {
  const idx = MAINLINE_ORDER.indexOf(stage);
  if (idx < 0 || idx === MAINLINE_ORDER.length - 1) return null;
  return MAINLINE_ORDER[idx + 1];
}
