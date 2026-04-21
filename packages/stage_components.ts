import { PageSchema } from "./schema";

export function buildComponentsStage(stage1Approved: PageSchema): PageSchema {
  const next: PageSchema = {
    root: stage1Approved.root,
    elements: JSON.parse(JSON.stringify(stage1Approved.elements))
  };

  if (!next.elements["demo-body"]) {
    next.elements["demo-body"] = {
      type: "Card",
      props: { title: "内容区域" },
      children: []
    };
    next.elements[next.root].children = [...(next.elements[next.root].children || []), "demo-body"];
  }

  next.elements["demo-toolbar"] = {
    type: "Space",
    props: { direction: "horizontal", gap: 8 },
    children: ["demo-search-input", "demo-search-btn"]
  };
  next.elements["demo-search-input"] = {
    type: "Input",
    props: { placeholder: "请输入关键词" },
    children: []
  };
  next.elements["demo-search-btn"] = {
    type: "Button",
    props: { label: "查询", variant: "primary" },
    children: []
  };
  next.elements["demo-table"] = {
    type: "Table",
    props: {
      columns: [
        { title: "名称", dataIndex: "name" },
        { title: "状态", dataIndex: "status" }
      ]
    },
    children: []
  };

  next.elements["demo-body"].children = ["demo-toolbar", "demo-table"];
  return next;
}
