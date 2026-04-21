import React from "react";

export function PreviewShell(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>{props.title}</h2>
      <div>{props.children}</div>
    </div>
  );
}
