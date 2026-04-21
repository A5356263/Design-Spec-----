import React from "react";
import { antLiteRegistry } from "./ant-lite-registry";

type NodeSchema = {
  type: string;
  props: Record<string, any>;
  children: string[];
};

type PageSchema = {
  root: string;
  elements: Record<string, NodeSchema>;
};

export function renderNode(id: string, page: PageSchema): React.ReactNode {
  const node = page.elements[id];
  if (!node) return null;

  const Comp = antLiteRegistry[node.type];
  if (!Comp) return null;

  const children = (node.children || []).map((childId) => (
    <React.Fragment key={childId}>{renderNode(childId, page)}</React.Fragment>
  ));

  return <Comp {...(node.props || {})}>{children}</Comp>;
}
