import { PageSchema } from "./schema";

export function buildContentStage(stage2Approved: PageSchema): PageSchema {
  const next: PageSchema = {
    root: stage2Approved.root,
    elements: JSON.parse(JSON.stringify(stage2Approved.elements))
  };

  if (next.elements["demo-table"]) {
    next.elements["demo-table"].props = {
      ...(next.elements["demo-table"].props || {}),
      rows: [
        { name: "样例 A", status: "正常" },
        { name: "样例 B", status: "待处理" }
      ]
    };
  }

  return next;
}
