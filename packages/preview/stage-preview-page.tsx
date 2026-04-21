import React from "react";
import { PreviewShell } from "./preview-shell";
import { renderNode } from "./render-node";

type NodeSchema = {
  type: string;
  props: Record<string, any>;
  children: string[];
};

type PageSchema = {
  root: string;
  elements: Record<string, NodeSchema>;
};

export function StagePreviewPage(props: { stageName: string; page: PageSchema }) {
  return (
    <PreviewShell title={`阶段预览：${props.stageName}`}>
      {renderNode(props.page.root, props.page)}
    </PreviewShell>
  );
}
