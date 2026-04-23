import { readFile, writeFile } from "node:fs/promises";
import { PageSchema } from "./schema";

type TableColumn = { title: string; dataIndex: string };

function escapeHtml(value: unknown): string {
  const text = value == null ? "" : String(value);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toCssLength(value: unknown): string {
  if (typeof value === "number") {
    return `${value}px`;
  }
  return String(value);
}

function normalizeColumns(columns: unknown): TableColumn[] {
  if (!Array.isArray(columns) || columns.length === 0) {
    return [{ title: "列", dataIndex: "value" }];
  }
  return columns.map((column, index) => {
    if (typeof column === "string") {
      return { title: column, dataIndex: column };
    }
    const safe = typeof column === "object" && column !== null ? (column as Record<string, unknown>) : {};
    return {
      title: safe.title ? String(safe.title) : `列${index + 1}`,
      dataIndex: safe.dataIndex ? String(safe.dataIndex) : `column_${index + 1}`
    };
  });
}

function levelTag(level: unknown): string {
  if (level === 1 || level === "h1") return "h1";
  if (level === 2 || level === "h2") return "h2";
  if (level === 3 || level === "h3") return "h3";
  if (level === 4 || level === "h4") return "h4";
  return "p";
}

function stackStyle(props: Record<string, unknown>): string {
  const styleParts: string[] = ["display:flex"];
  styleParts.push(`flex-direction:${props.direction === "vertical" ? "column" : "row"}`);
  if (props.gap != null) {
    styleParts.push(`gap:${toCssLength(props.gap)}`);
  }
  if (props.align) {
    const align = props.align === "start" ? "flex-start" : props.align === "end" ? "flex-end" : String(props.align);
    styleParts.push(`align-items:${align}`);
  }
  if (props.justify) {
    const justify = props.justify === "start" ? "flex-start" : props.justify === "end" ? "flex-end" : String(props.justify);
    styleParts.push(`justify-content:${justify}`);
  }
  if (props.wrap) {
    styleParts.push(`flex-wrap:${props.wrap === "wrap" ? "wrap" : "nowrap"}`);
  }
  if (props.width != null) {
    styleParts.push(`width:${toCssLength(props.width)}`);
  }
  return styleParts.join(";");
}

function renderNode(nodeId: string, page: PageSchema): string {
  const node = page.elements[nodeId];
  if (!node) {
    return `<div class="node-fallback">缺失节点：${escapeHtml(nodeId)}</div>`;
  }
  const props = (node.props ?? {}) as Record<string, unknown>;
  const children = (node.children ?? []).map((childId) => renderNode(childId, page)).join("");

  if (node.type === "Flex") {
    return `<div class="node-flex" style="${stackStyle(props)}">${children}</div>`;
  }
  if (node.type === "Space") {
    return `<div class="node-space" style="${stackStyle(props)}">${children}</div>`;
  }
  if (node.type === "Card") {
    const title = props.title ? `<div class="node-card-header">${escapeHtml(props.title)}</div>` : "";
    const bodyStyle: string[] = [];
    if (props.padding != null) bodyStyle.push(`padding:${toCssLength(props.padding)}`);
    if (props.gap != null) bodyStyle.push(`gap:${toCssLength(props.gap)}`);
    const widthStyle = props.width != null ? `style="width:${toCssLength(props.width)}"` : "";
    return `<section class="node-card" ${widthStyle}>${title}<div class="node-card-body" style="${bodyStyle.join(";")}">${children}</div></section>`;
  }
  if (node.type === "TypographyText") {
    const tag = levelTag(props.level);
    const cls = props.emphasis === "strong" ? "node-typography is-strong" : "node-typography";
    return `<${tag} class="${cls}">${escapeHtml(props.text)}</${tag}>`;
  }
  if (node.type === "Skeleton") {
    const rowCount = typeof props.rows === "number" ? props.rows : 3;
    const rows = Array.from({ length: rowCount })
      .map((_, idx) => `<div class="node-skeleton-row"${idx === rowCount - 1 ? ' style="width:72%"' : ""}></div>`)
      .join("");
    return `<div class="node-skeleton">${rows}</div>`;
  }
  if (node.type === "Button") {
    const cls = props.variant === "primary" ? "node-button primary" : "node-button";
    const disabled = props.disabled ? " disabled" : "";
    return `<button class="${cls}" type="button"${disabled}>${escapeHtml(props.label || "按钮")}</button>`;
  }
  if (node.type === "Tag") {
    return `<span class="node-tag">${escapeHtml(props.label)}</span>`;
  }
  if (node.type === "Form") {
    return `<div class="node-form">${children}</div>`;
  }
  if (node.type === "Input") {
    const placeholder = props.placeholder ? ` placeholder="${escapeHtml(props.placeholder)}"` : "";
    const value = props.value != null ? ` value="${escapeHtml(props.value)}"` : "";
    const disabled = props.disabled ? " disabled" : "";
    return `<input class="node-input" type="text" readonly${placeholder}${value}${disabled} />`;
  }
  if (node.type === "Select") {
    const options = Array.isArray(props.options) ? props.options : [];
    const placeholder = props.placeholder ? `<option value="">${escapeHtml(props.placeholder)}</option>` : "";
    const optionHtml = options.map((it) => `<option>${escapeHtml(it)}</option>`).join("");
    return `<select class="node-select" disabled>${placeholder}${optionHtml}</select>`;
  }
  if (node.type === "Table") {
    const columns = normalizeColumns(props.columns);
    const rows = Array.isArray(props.rows) ? (props.rows as Array<Record<string, unknown>>) : [];
    const head = columns.map((col) => `<th>${escapeHtml(col.title)}</th>`).join("");
    let body = "";
    if (!rows.length) {
      body = `<tr><td colspan="${columns.length || 1}" class="table-empty-cell">当前表格暂无数据</td></tr>`;
    } else {
      body = rows
        .map((row) => {
          const cells = columns.map((col) => `<td>${escapeHtml(row?.[col.dataIndex])}</td>`).join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
    }
    return `<div class="node-table-wrapper"><table class="node-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }
  if (node.type === "Alert") {
    const message = `<div class="node-alert-message">${escapeHtml(props.message)}</div>`;
    const description = props.description ? `<div class="node-alert-description">${escapeHtml(props.description)}</div>` : "";
    return `<div class="node-alert">${message}${description}</div>`;
  }
  return `<div class="node-fallback">未适配组件：${escapeHtml(node.type)}</div>`;
}

function renderHtmlDoc(page: PageSchema, title: string, sourcePath: string): string {
  const body = renderNode(page.root, page);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{margin:0;background:#f5f7fb;color:#1f2937;font-family:Arial,"Microsoft YaHei",sans-serif}
    .page{padding:20px}
    .meta{margin:0 0 12px;padding:10px 12px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;font-size:12px;word-break:break-all}
    .node-flex,.node-space,.node-form{display:flex}
    .node-card{border:1px solid #d7deea;border-radius:12px;background:#fff}
    .node-card-header{padding:12px 14px;border-bottom:1px solid #e5eaf3;font-weight:700}
    .node-card-body{display:flex;flex-direction:column;padding:14px;gap:10px}
    .node-typography{margin:0;line-height:1.6}.is-strong{font-weight:700}
    .node-button{height:36px;min-width:96px;padding:0 14px;border-radius:8px;border:1px solid #c8d1df;background:#fff}
    .node-button.primary{background:#2563eb;color:#fff;border-color:#2563eb}
    .node-tag{display:inline-flex;padding:3px 10px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:13px}
    .node-input,.node-select{width:100%;min-height:36px;padding:0 10px;border:1px solid #c8d1df;border-radius:8px}
    .node-form{flex-direction:column;gap:10px}
    .node-table{width:100%;border-collapse:collapse;table-layout:fixed}
    .node-table th,.node-table td{border:1px solid #d7deea;padding:10px;text-align:left;vertical-align:top}
    .node-table th{background:#f8faff}
    .table-empty-cell{text-align:center;color:#64748b}
    .node-alert{padding:12px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff}
    .node-alert-message{font-weight:700}.node-alert-description{margin-top:6px;line-height:1.6}
    .node-skeleton{display:flex;flex-direction:column;gap:8px}
    .node-skeleton-row{height:14px;border-radius:8px;background:#e5e7eb}
    .node-fallback{padding:10px;border:1px dashed #cbd5e1;border-radius:8px;background:#f8fafc}
  </style>
</head>
<body>
  <div class="page">
    <div class="meta">来源：${escapeHtml(sourcePath)}</div>
    ${body}
  </div>
</body>
</html>
`;
}

function parsePage(raw: string): PageSchema {
  return JSON.parse(raw.replace(/^\uFEFF/, "")) as PageSchema;
}

export async function exportPageHtmlFromJson(jsonPath: string, htmlPath: string, title: string, sourcePath: string): Promise<void> {
  const page = parsePage(await readFile(jsonPath, "utf8"));
  const html = renderHtmlDoc(page, title, sourcePath);
  await writeFile(htmlPath, html, "utf8");
}
