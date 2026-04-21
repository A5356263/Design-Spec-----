import { PageSchema } from "./schema";

function pickTitle(designSpec: string): string {
  const line = designSpec
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.startsWith("- "));
  return line ? line.replace(/^- /, "").slice(0, 28) : "页面骨架标题";
}

export function buildSkeletonStage(designSpec: string): PageSchema {
  const title = pickTitle(designSpec);
  return {
    root: "demo-root",
    elements: {
      "demo-root": {
        type: "Flex",
        props: { direction: "vertical", gap: 12 },
        children: ["demo-header", "demo-body"]
      },
      "demo-header": {
        type: "Card",
        props: { title },
        children: ["demo-title"]
      },
      "demo-title": {
        type: "TypographyText",
        props: { text: "阶段一占位文本" },
        children: []
      },
      "demo-body": {
        type: "Card",
        props: { title: "内容区域占位" },
        children: []
      }
    }
  };
}
