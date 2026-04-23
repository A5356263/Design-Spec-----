const CURRENT_RUN_PATH = "../../workdir/current_run.json";
const STAGE_VERSION_OPTIONS = {
  stage_1_skeleton: ["candidate", "approved"],
  stage_2_components: ["candidate", "approved"],
  stage_3_content: ["candidate", "approved"],
  final: ["final"]
};

const dom = {
  runIdInput: document.querySelector("#run-id-input"),
  stageSelect: document.querySelector("#stage-select"),
  versionSelect: document.querySelector("#version-select"),
  reloadButton: document.querySelector("#reload-button"),
  useCurrentRunButton: document.querySelector("#use-current-run-button"),
  previewTitle: document.querySelector("#preview-title"),
  previewSubtitle: document.querySelector("#preview-subtitle"),
  previewCanvas: document.querySelector("#preview-canvas"),
  sourcePath: document.querySelector("#source-path"),
  statusText: document.querySelector("#status-text"),
  errorBox: document.querySelector("#error-box")
};

async function main() {
  bindEvents();
  syncVersionOptions();
  await loadCurrentRunIntoInput();
  await renderSelectedPage();
}

function bindEvents() {
  dom.stageSelect.addEventListener("change", async () => {
    syncVersionOptions();
    await renderSelectedPage();
  });

  dom.versionSelect.addEventListener("change", async () => {
    await renderSelectedPage();
  });

  dom.reloadButton.addEventListener("click", async () => {
    await renderSelectedPage();
  });

  dom.useCurrentRunButton.addEventListener("click", async () => {
    await loadCurrentRunIntoInput();
    await renderSelectedPage();
  });

  dom.runIdInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      await renderSelectedPage();
    }
  });
}

function syncVersionOptions() {
  const stage = dom.stageSelect.value;
  const allowedVersions = STAGE_VERSION_OPTIONS[stage] || ["candidate"];
  const currentVersion = dom.versionSelect.value;

  dom.versionSelect.innerHTML = "";
  for (const version of allowedVersions) {
    const option = document.createElement("option");
    option.value = version;
    option.textContent = version;
    dom.versionSelect.appendChild(option);
  }

  dom.versionSelect.disabled = allowedVersions.length === 1;
  dom.versionSelect.value = allowedVersions.includes(currentVersion) ? currentVersion : allowedVersions[0];
}

async function loadCurrentRunIntoInput() {
  try {
    setStatus("正在读取 current_run.json");
    const currentRun = await fetchJson(CURRENT_RUN_PATH);
    dom.runIdInput.value = currentRun.run_id || "";
    clearError();
  } catch (error) {
    showError(`无法读取 current_run.json：${toErrorMessage(error)}`);
  }
}

async function renderSelectedPage() {
  const runId = dom.runIdInput.value.trim();
  const stage = dom.stageSelect.value;
  const version = dom.versionSelect.value;

  if (!runId) {
    setStatus("缺少 run_id");
    showError("请先读取当前轮，或手动输入 run_id。");
    renderEmptyState("请输入 run_id 后再加载预览。");
    return;
  }

  const relativePath = buildRelativeJsonPath(runId, stage, version);
  dom.sourcePath.textContent = `workdir/runs/${runId}/workspace/${toWorkspacePath(stage, version)}`;
  dom.previewTitle.textContent = `阶段预览：${stage}`;
  dom.previewSubtitle.textContent = `run_id=${runId} | version=${version}`;

  try {
    setStatus("正在读取页面 JSON");
    clearError();
    const page = await fetchJson(relativePath);
    validatePageSchema(page);
    renderPage(page);
    setStatus("加载完成");
  } catch (error) {
    renderEmptyState("当前文件无法预览。");
    showError(`${dom.sourcePath.textContent}\n${toErrorMessage(error)}`);
    setStatus("加载失败");
  }
}

function buildRelativeJsonPath(runId, stage, version) {
  if (stage === "final") {
    return `../../workdir/runs/${runId}/workspace/final/final.page.json`;
  }
  return `../../workdir/runs/${runId}/workspace/${stage}/${version}.page.json`;
}

function toWorkspacePath(stage, version) {
  if (stage === "final") {
    return "final/final.page.json";
  }
  return `${stage}/${version}.page.json`;
}

async function fetchJson(relativePath) {
  const url = new URL(relativePath, window.location.href);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`读取失败：HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function validatePageSchema(page) {
  if (!page || typeof page !== "object") {
    throw new Error("页面 JSON 不是对象。");
  }
  if (!page.root || !page.elements || typeof page.elements !== "object") {
    throw new Error("页面 JSON 缺少 root 或 elements。");
  }
  if (!page.elements[page.root]) {
    throw new Error(`root 节点 ${page.root} 不存在。`);
  }
}

function renderPage(page) {
  dom.previewCanvas.innerHTML = "";
  const rootNode = renderNode(page.root, page);
  dom.previewCanvas.appendChild(rootNode);
}

function renderNode(nodeId, page) {
  const node = page.elements[nodeId];
  if (!node) {
    return createFallbackNode("MissingNode", { id: nodeId }, []);
  }

  const children = Array.isArray(node.children)
    ? node.children.map((childId) => renderNode(childId, page))
    : [];

  switch (node.type) {
    case "Flex":
      return renderFlex(node, children);
    case "Space":
      return renderSpace(node, children);
    case "Card":
      return renderCard(node, children);
    case "TypographyText":
      return renderTypographyText(node);
    case "Skeleton":
      return renderSkeleton(node);
    case "Button":
      return renderButton(node);
    case "Tag":
      return renderTag(node);
    case "Form":
      return renderForm(node, children);
    case "Input":
      return renderInput(node);
    case "Select":
      return renderSelect(node);
    case "Table":
      return renderTable(node);
    case "Alert":
      return renderAlert(node);
    default:
      return createFallbackNode(node.type, node.props || {}, children);
  }
}

function renderFlex(node, children) {
  const element = document.createElement("div");
  element.className = "node-flex";
  applyStackStyles(element, node.props);
  appendChildren(element, children);
  return element;
}

function renderSpace(node, children) {
  const element = document.createElement("div");
  element.className = "node-space";
  applyStackStyles(element, node.props);
  appendChildren(element, children);
  return element;
}

function renderCard(node, children) {
  const element = document.createElement("section");
  element.className = "node-card";
  if (node.props && node.props.width != null) {
    element.style.width = toCssLength(node.props.width);
  }

  if (node.props && node.props.title) {
    const header = document.createElement("div");
    header.className = "node-card-header";
    header.textContent = String(node.props.title);
    element.appendChild(header);
  }

  const body = document.createElement("div");
  body.className = "node-card-body";
  if (node.props && node.props.padding != null) {
    body.style.padding = toCssLength(node.props.padding);
  }
  if (node.props && node.props.gap != null) {
    body.style.gap = toCssLength(node.props.gap);
  }
  appendChildren(body, children);
  element.appendChild(body);
  return element;
}

function renderTypographyText(node) {
  const level = node.props && node.props.level;
  const tagName = levelToTagName(level);
  const element = document.createElement(tagName);
  element.className = "node-typography";
  if (node.props && node.props.emphasis === "strong") {
    element.classList.add("is-strong");
  }
  element.textContent = node.props && node.props.text ? String(node.props.text) : "";
  return element;
}

function renderSkeleton(node) {
  const element = document.createElement("div");
  element.className = "node-skeleton";
  const rowCount = node.props && typeof node.props.rows === "number" ? node.props.rows : 3;
  for (let index = 0; index < rowCount; index += 1) {
    const row = document.createElement("div");
    row.className = "node-skeleton-row";
    if (index === rowCount - 1) {
      row.style.width = "72%";
    }
    element.appendChild(row);
  }
  return element;
}

function renderButton(node) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "node-button";
  if (node.props && node.props.variant) {
    element.dataset.variant = String(node.props.variant);
  }
  if (node.props && node.props.size) {
    element.dataset.size = String(node.props.size);
  }
  if (node.props && node.props.disabled) {
    element.disabled = true;
  }
  element.textContent = node.props && node.props.label ? String(node.props.label) : "按钮";
  return element;
}

function renderTag(node) {
  const element = document.createElement("span");
  element.className = "node-tag";
  if (node.props && node.props.tone) {
    element.dataset.tone = String(node.props.tone);
  }
  element.textContent = node.props && node.props.label ? String(node.props.label) : "";
  return element;
}

function renderForm(node, children) {
  const element = document.createElement("div");
  element.className = "node-form";
  if (node.props && node.props.disabled) {
    element.dataset.disabled = "true";
  }
  appendChildren(element, children);
  return element;
}

function renderInput(node) {
  const element = document.createElement("input");
  element.className = "node-input";
  element.type = "text";
  element.readOnly = true;
  if (node.props && node.props.placeholder) {
    element.placeholder = String(node.props.placeholder);
  }
  if (node.props && node.props.value != null) {
    element.value = String(node.props.value);
  }
  if (node.props && node.props.disabled) {
    element.disabled = true;
  }
  return element;
}

function renderSelect(node) {
  const element = document.createElement("select");
  element.className = "node-select";
  element.disabled = true;

  const options = Array.isArray(node.props && node.props.options) ? node.props.options : [];
  if (node.props && node.props.placeholder) {
    const placeholderOption = document.createElement("option");
    placeholderOption.textContent = String(node.props.placeholder);
    placeholderOption.value = "";
    element.appendChild(placeholderOption);
  }

  for (const optionValue of options) {
    const option = document.createElement("option");
    option.value = String(optionValue);
    option.textContent = String(optionValue);
    element.appendChild(option);
  }

  if (node.props && node.props.value != null) {
    element.value = String(node.props.value);
  }

  return element;
}

function renderTable(node) {
  const wrapper = document.createElement("div");
  wrapper.className = "node-table-wrapper";
  if (node.props && node.props.width != null) {
    wrapper.style.width = toCssLength(node.props.width);
  }

  const table = document.createElement("table");
  table.className = "node-table";
  if (node.props && node.props.bordered) {
    table.dataset.bordered = "true";
  }

  const columns = normalizeColumns(node.props && node.props.columns);
  const rows = Array.isArray(node.props && node.props.rows) ? node.props.rows : [];

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const column of columns) {
    const th = document.createElement("th");
    th.textContent = column.title;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = Math.max(columns.length, 1);
    cell.className = "table-empty-cell";
    cell.textContent = "当前表格暂无数据";
    row.appendChild(cell);
    tbody.appendChild(row);
  } else {
    for (const rowData of rows) {
      const row = document.createElement("tr");
      for (const column of columns) {
        const cell = document.createElement("td");
        const value = rowData && column.dataIndex in rowData ? rowData[column.dataIndex] : "";
        cell.textContent = value == null ? "" : String(value);
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
  }

  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

function renderAlert(node) {
  const element = document.createElement("div");
  element.className = "node-alert";
  if (node.props && node.props.tone) {
    element.dataset.tone = String(node.props.tone);
  }

  const message = document.createElement("div");
  message.className = "node-alert-message";
  message.textContent = node.props && node.props.message ? String(node.props.message) : "";
  element.appendChild(message);

  if (node.props && node.props.description) {
    const description = document.createElement("div");
    description.className = "node-alert-description";
    description.textContent = String(node.props.description);
    element.appendChild(description);
  }

  return element;
}

function createFallbackNode(type, props, children) {
  const element = document.createElement("div");
  element.className = "node-fallback";

  const title = document.createElement("div");
  title.className = "node-fallback-title";
  title.textContent = `未适配组件：${type}`;
  element.appendChild(title);

  const detail = document.createElement("pre");
  detail.className = "node-fallback-props";
  detail.textContent = JSON.stringify(props || {}, null, 2);
  element.appendChild(detail);

  if (children.length) {
    const childContainer = document.createElement("div");
    childContainer.className = "node-fallback-children";
    appendChildren(childContainer, children);
    element.appendChild(childContainer);
  }

  return element;
}

function appendChildren(parent, children) {
  for (const child of children) {
    parent.appendChild(child);
  }
}

function applyStackStyles(element, props) {
  const direction = props && props.direction ? String(props.direction) : "horizontal";
  element.style.display = "flex";
  element.style.flexDirection = direction === "vertical" ? "column" : "row";
  if (props && props.gap != null) {
    element.style.gap = toCssLength(props.gap);
  }
  if (props && props.align) {
    element.style.alignItems = mapAlignValue(String(props.align));
  }
  if (props && props.justify) {
    element.style.justifyContent = mapJustifyValue(String(props.justify));
  }
  if (props && props.wrap) {
    element.style.flexWrap = String(props.wrap) === "wrap" ? "wrap" : "nowrap";
  }
  if (props && props.width != null) {
    element.style.width = toCssLength(props.width);
  }
}

function normalizeColumns(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return [{ title: "列", dataIndex: "value" }];
  }

  return columns.map((column, index) => {
    if (typeof column === "string") {
      return { title: column, dataIndex: column };
    }
    return {
      title: column && column.title ? String(column.title) : `列${index + 1}`,
      dataIndex: column && column.dataIndex ? String(column.dataIndex) : `column_${index + 1}`
    };
  });
}

function levelToTagName(level) {
  if (level === 1 || level === "h1") return "h1";
  if (level === 2 || level === "h2") return "h2";
  if (level === 3 || level === "h3") return "h3";
  if (level === 4 || level === "h4") return "h4";
  return "p";
}

function toCssLength(value) {
  if (typeof value === "number") {
    return `${value}px`;
  }
  return String(value);
}

function mapAlignValue(value) {
  if (value === "start") return "flex-start";
  if (value === "end") return "flex-end";
  return value;
}

function mapJustifyValue(value) {
  if (value === "start") return "flex-start";
  if (value === "end") return "flex-end";
  return value;
}

function renderEmptyState(message) {
  dom.previewCanvas.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  dom.previewCanvas.appendChild(empty);
}

function setStatus(text) {
  dom.statusText.textContent = text;
}

function showError(message) {
  dom.errorBox.textContent =
    `${message}\n\n提示：若浏览器直接以 file:// 打开页面导致读取失败，请改用本地静态服务从仓库根目录打开该页面。`;
  dom.errorBox.classList.remove("hidden");
}

function clearError() {
  dom.errorBox.textContent = "";
  dom.errorBox.classList.add("hidden");
}

function toErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

main();
