import { readFile } from "node:fs/promises";
import path from "node:path";
import { PageNode, PageSchema, StageName } from "./schema";

export type Section = {
  title: string;
  level: number;
  lines: string[];
  bullets: string[];
  ordered: string[];
  parentTitle: string | null;
};

export type AgentArtifacts = {
  page: PageSchema;
  prompt: string;
  context: Record<string, unknown>;
};

type InputBundle = {
  designSpec: string;
  constraints: string;
  protocol: string;
  catalog: string;
  references: string;
};

const META_TITLES = ["页面目标", "页面整体布局", "风格要求", "三阶段要求"];

function clonePage(page: PageSchema): PageSchema {
  return {
    root: page.root,
    elements: JSON.parse(JSON.stringify(page.elements))
  };
}

function makeIdFactory(): () => string {
  let seq = 0;
  return () => `node-${++seq}`;
}

function makePageIdFactory(page: PageSchema): () => string {
  let seq = Object.keys(page.elements).length;
  return () => {
    do {
      seq += 1;
    } while (page.elements[`node-${seq}`]);
    return `node-${seq}`;
  };
}

function cleanLine(line: string): string {
  return line.trim().replace(/^[*-]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

export function parseSections(markdown: string): Section[] {
  const lines = markdown.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headings: Array<{ index: number; level: number; title: string }> = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (!match) continue;
    headings.push({ index: i, level: match[1].length, title: match[2].trim() });
  }

  return headings.map((heading, idx) => {
    const end = headings
      .slice(idx + 1)
      .find((item) => item.level <= heading.level)?.index ?? lines.length;
    const body = lines.slice(heading.index + 1, end);
    const parent = [...headings]
      .slice(0, idx)
      .reverse()
      .find((item) => item.level < heading.level);

    return {
      title: heading.title,
      level: heading.level,
      lines: body.map((item) => item.trim()).filter(Boolean),
      bullets: body
        .map((item) => item.trim())
        .filter((item) => /^[-*]\s+/.test(item))
        .map(cleanLine),
      ordered: body
        .map((item) => item.trim())
        .filter((item) => /^\d+\.\s+/.test(item))
        .map(cleanLine),
      parentTitle: parent?.title ?? null
    };
  });
}

function isMetaSection(section: Section): boolean {
  return META_TITLES.includes(section.title) || /^阶段[一二三]/.test(section.title);
}

function findSection(sections: Section[], matcher: (section: Section) => boolean): Section | undefined {
  return sections.find((section) => !isMetaSection(section) && matcher(section));
}

function findByTitle(sections: Section[], title: string): Section | undefined {
  return sections.find((section) => section.title === title);
}

function extractPageRequirementTitle(sections: Section[]): string {
  const section = sections.find((item) => item.title.startsWith("页面需求："));
  if (!section) return "业务页面";
  return section.title.replace("页面需求：", "").trim() || "业务页面";
}

function extractValue(prefix: string, lines: string[]): string | null {
  const line = lines.find((item) => item.includes(prefix));
  if (!line) return null;
  const index = line.indexOf(prefix);
  return line.slice(index + prefix.length).replace(/^[:：]/, "").trim() || null;
}

function extractPlainBullets(section: Section): string[] {
  return section.bullets.filter((item) => !item.includes("：") && !item.includes(":"));
}

function createNode(type: string, props: Record<string, unknown> = {}, children: string[] = []): PageNode {
  return { type, props, children };
}

function buildSkeletonPage(sections: Section[]): PageSchema {
  const nextId = makeIdFactory();
  const elements: Record<string, PageNode> = {};
  const root = nextId();
  elements[root] = createNode("Flex", { direction: "vertical", gap: 16 }, []);

  const topSection = findSection(sections, (item) => /顶部|头部/.test(item.title));
  const leftSection = findSection(sections, (item) => /左侧/.test(item.title));
  const rightSection = findSection(sections, (item) => /右侧/.test(item.title));
  const mainSection = findSection(sections, (item) => /主体区|内容区|主内容/.test(item.title));
  const bottomSection = findSection(sections, (item) => /底部/.test(item.title));

  const appendCard = (title: string): string => {
    const id = nextId();
    elements[id] = createNode("Card", { title }, []);
    elements[root].children.push(id);
    return id;
  };

  if (topSection) {
    appendCard(topSection.title);
  }

  if (leftSection || rightSection) {
    const mainId = nextId();
    elements[mainId] = createNode("Flex", { direction: "horizontal", gap: 16 }, []);
    elements[root].children.push(mainId);

    if (leftSection) {
      const leftId = nextId();
      elements[leftId] = createNode("Card", { title: leftSection.title, width: "70%" }, []);
      elements[mainId].children.push(leftId);
      const children = sections.filter((item) => item.parentTitle === leftSection.title && !isMetaSection(item));
      for (const child of children) {
        const childId = nextId();
        elements[childId] = createNode("Card", { title: child.title }, []);
        elements[leftId].children.push(childId);
      }
    }

    if (rightSection) {
      const rightId = nextId();
      elements[rightId] = createNode("Card", { title: rightSection.title, width: "30%" }, []);
      elements[mainId].children.push(rightId);
      const children = sections.filter((item) => item.parentTitle === rightSection.title && !isMetaSection(item));
      for (const child of children) {
        const childId = nextId();
        elements[childId] = createNode("Card", { title: child.title }, []);
        elements[rightId].children.push(childId);
      }
    }
  } else if (mainSection) {
    appendCard(mainSection.title);
  }

  if (bottomSection) {
    appendCard(bottomSection.title);
  }

  const usedTitles = new Set(
    Object.values(elements)
      .map((node) => node.props.title)
      .filter((item): item is string => typeof item === "string")
  );

  for (const section of sections) {
    if (isMetaSection(section)) continue;
    if (usedTitles.has(section.title)) continue;
    if (/页面需求：/.test(section.title)) continue;
    if (section.parentTitle && usedTitles.has(section.parentTitle)) continue;
    appendCard(section.title);
  }

  if (elements[root].children.length === 0) {
    const fallbackId = nextId();
    elements[fallbackId] = createNode("Card", { title: extractPageRequirementTitle(sections) }, []);
    elements[root].children.push(fallbackId);
  }

  return { root, elements };
}

function findCardByTitle(page: PageSchema, title: string): string | undefined {
  return Object.entries(page.elements).find(([, node]) => node.type === "Card" && node.props.title === title)?.[0];
}

function appendChild(page: PageSchema, parentId: string, childId: string): void {
  const parent = page.elements[parentId];
  if (!parent.children.includes(childId)) {
    parent.children.push(childId);
  }
}

function buildTopComponents(page: PageSchema, sections: Section[]): void {
  const topSection = findSection(sections, (item) => /顶部|头部/.test(item.title));
  if (!topSection) return;
  const topId = findCardByTitle(page, topSection.title);
  if (!topId) return;

  const nextId = makePageIdFactory(page);
  const pageTitle = extractValue("页面标题", topSection.lines) ?? extractPageRequirementTitle(sections);
  const pageDesc = extractValue("页面说明", topSection.lines);
  const statusLabel = extractValue("状态标签", topSection.lines);
  const buttons = extractPlainBullets(topSection).filter((item) => !item.includes("页面标题"));

  const titleId = nextId();
  page.elements[titleId] = createNode("TypographyText", { text: pageTitle, level: "h3" }, []);
  appendChild(page, topId, titleId);

  if (pageDesc) {
    const descId = nextId();
    page.elements[descId] = createNode("TypographyText", { text: pageDesc }, []);
    appendChild(page, topId, descId);
  }

  if (statusLabel) {
    const tagId = nextId();
    page.elements[tagId] = createNode("Tag", { label: statusLabel, tone: "default" }, []);
    appendChild(page, topId, tagId);
  }

  if (buttons.length > 0) {
    const spaceId = nextId();
    page.elements[spaceId] = createNode("Space", { direction: "horizontal", gap: 8 }, []);
    appendChild(page, topId, spaceId);
    for (const button of buttons) {
      const buttonId = nextId();
      const variant = /提交|保存|确认/.test(button) ? "primary" : "default";
      page.elements[buttonId] = createNode("Button", { label: button, variant }, []);
      appendChild(page, spaceId, buttonId);
    }
  }
}

function buildSectionComponents(page: PageSchema, sections: Section[]): void {
  const nextId = makePageIdFactory(page);

  for (const section of sections) {
    const sectionId = findCardByTitle(page, section.title);
    if (!sectionId) continue;
    if (/顶部|头部|底部/.test(section.title)) continue;

    const raw = section.lines.join("\n");

    if (/使用表单|字段/.test(raw)) {
      const formId = nextId();
      page.elements[formId] = createNode("Form", { layout: "vertical" }, []);
      appendChild(page, sectionId, formId);
      for (const field of extractPlainBullets(section)) {
        const inputId = nextId();
        page.elements[inputId] = createNode("Input", { placeholder: field }, []);
        appendChild(page, formId, inputId);
      }
      continue;
    }

    if (/表格/.test(raw)) {
      const columns = extractPlainBullets(section).map((item) => ({ title: item, dataIndex: item }));
      const tableId = nextId();
      page.elements[tableId] = createNode("Table", { columns, bordered: true }, []);
      appendChild(page, sectionId, tableId);
      continue;
    }

    if (/多行输入|输入区域|补充说明/.test(raw) || /补充说明/.test(section.title)) {
      const inputId = nextId();
      page.elements[inputId] = createNode("Input", { placeholder: section.title }, []);
      appendChild(page, sectionId, inputId);
      continue;
    }

    if (/提示|规则/.test(section.title)) {
      const bullets = section.bullets.length > 0 ? section.bullets : ["待补充提示"];
      for (let i = 0; i < bullets.length; i += 1) {
        const textId = nextId();
        page.elements[textId] = createNode("TypographyText", { text: `待补充内容 ${i + 1}` }, []);
        appendChild(page, sectionId, textId);
      }
      continue;
    }

    if (/汇总/.test(section.title)) {
      const descId = nextId();
      page.elements[descId] = createNode("Descriptions", { columns: 1 }, []);
      appendChild(page, sectionId, descId);
      continue;
    }
  }
}

function buildBottomComponents(page: PageSchema, sections: Section[]): void {
  const bottomSection = findSection(sections, (item) => /底部/.test(item.title));
  if (!bottomSection) return;
  const bottomId = findCardByTitle(page, bottomSection.title);
  if (!bottomId) return;

  const buttons = extractPlainBullets(bottomSection);
  if (buttons.length === 0) return;

  const nextId = makePageIdFactory(page);
  const spaceId = nextId();
  page.elements[spaceId] = createNode("Space", { direction: "horizontal", gap: 8 }, []);
  appendChild(page, bottomId, spaceId);

  for (const button of buttons) {
    const buttonId = nextId();
    const variant = /提交|保存|确认/.test(button) ? "primary" : "default";
    page.elements[buttonId] = createNode("Button", { label: button, variant }, []);
    appendChild(page, spaceId, buttonId);
  }
}

function applyContent(page: PageSchema, sections: Section[]): void {
  const pageTitle = extractPageRequirementTitle(sections).replace(/创建页|详情页|列表页/g, "").trim();
  const topSection = findSection(sections, (item) => /顶部|头部/.test(item.title));
  const pageDesc = topSection ? extractValue("页面说明", topSection.lines) : null;
  const statusLabel = topSection ? extractValue("状态标签", topSection.lines) : null;

  for (const node of Object.values(page.elements)) {
    if (node.type === "TypographyText" && node.props.text === "待补充内容 1") {
      node.props.text = "请按当前文档补充内容";
    }
  }

  for (const [nodeId, node] of Object.entries(page.elements)) {
    if (node.type === "TypographyText" && node.props.level === "h3") {
      node.props.text = pageTitle || String(node.props.text || "");
    }
    if (node.type === "TypographyText" && !node.props.level && pageDesc && String(node.props.text).includes("用于")) {
      node.props.text = pageDesc;
    }
    if (node.type === "Tag" && statusLabel) {
      node.props.label = statusLabel;
    }
    if (node.type === "Table") {
      const hostId = Object.entries(page.elements).find(([, parent]) => parent.children.includes(nodeId))?.[0];
      const hostTitle = hostId ? String(page.elements[hostId].props.title || "") : "";
      const section = findByTitle(sections, hostTitle);
      if (section) {
        const rows = section.ordered
          .map((item) => item.split("/").map((part) => part.trim()).filter(Boolean))
          .filter((parts) => parts.length > 1);
        const columns = Array.isArray(node.props.columns) ? node.props.columns : [];
        node.props.rows = rows.map((parts) => {
          const record: Record<string, unknown> = {};
          for (let i = 0; i < columns.length; i += 1) {
            const column = columns[i] as Record<string, unknown>;
            const dataIndex = String(column.dataIndex ?? `col_${i}`);
            record[dataIndex] = parts[i] ?? "";
          }
          return record;
        });
      }
    }
    if (node.type === "Descriptions") {
      const hostId = Object.entries(page.elements).find(([, parent]) => parent.children.includes(nodeId))?.[0];
      const hostTitle = hostId ? String(page.elements[hostId].props.title || "") : "";
      const section = findByTitle(sections, hostTitle);
      if (section) {
        node.props.items = section.bullets
          .map((item) => item.split(/[:：]/))
          .filter((parts) => parts.length >= 2)
          .map(([label, ...value]) => ({ label: label.trim(), value: value.join("：").trim() }));
      }
    }
  }

  for (const section of sections.filter((item) => /提示|规则/.test(item.title))) {
    const sectionId = findCardByTitle(page, section.title);
    if (!sectionId) continue;
    const textIds = page.elements[sectionId].children.filter((childId) => page.elements[childId]?.type === "TypographyText");
    for (let i = 0; i < textIds.length; i += 1) {
      const bullet = section.bullets[i];
      if (bullet) {
        page.elements[textIds[i]].props.text = bullet;
      }
    }
  }
}

function buildPrompt(stageName: StageName, bundle: InputBundle, previousApproved: PageSchema | null): string {
  const base = [
    `你是 ${stageName} 阶段的页面生成 Agent。`,
    "",
    "输入上下文：",
    "- input/design_spec.md",
    "- input/constraints.md",
    "- FLAT_JSON_PROTOCOL.md",
    "- config/ANT_LITE_CATALOG.json"
  ];

  if (previousApproved) {
    base.push("- 上一阶段 approved.page.json");
  }

  base.push(
    "",
    "必须遵守：",
    "- 只输出合法 flat page json",
    "- 只能使用 catalog 允许的 type/props",
    "- 遵守当前阶段边界",
    "- 后阶段不得默认推翻前阶段通过结构",
    "",
    "不要套用固定页面模板，不要套用固定 archetype。",
    "页面结构与组件必须来自当前文档，而不是来自历史 demo。"
  );

  return [
    ...base,
    "",
    "design_spec 摘要：",
    bundle.designSpec.trim(),
    "",
    "constraints 摘要：",
    bundle.constraints.trim()
  ].join("\n");
}

async function readInputBundle(projectRoot: string): Promise<InputBundle> {
  const [designSpec, constraints, protocol, catalog, references] = await Promise.all([
    readFile(path.join(projectRoot, "input/design_spec.md"), "utf8"),
    readFile(path.join(projectRoot, "input/constraints.md"), "utf8"),
    readFile(path.join(projectRoot, "FLAT_JSON_PROTOCOL.md"), "utf8"),
    readFile(path.join(projectRoot, "config/ANT_LITE_CATALOG.json"), "utf8"),
    readFile(path.join(projectRoot, "input/references.md"), "utf8")
  ]);

  return { designSpec, constraints, protocol, catalog, references };
}

export async function runDocumentAgent(
  projectRoot: string,
  stageName: StageName,
  previousApproved: PageSchema | null
): Promise<AgentArtifacts> {
  const bundle = await readInputBundle(projectRoot);
  const sections = parseSections(bundle.designSpec);

  let page = previousApproved ? clonePage(previousApproved) : buildSkeletonPage(sections);
  if (stageName === "stage_2_components") {
    buildTopComponents(page, sections);
    buildSectionComponents(page, sections);
    buildBottomComponents(page, sections);
  }
  if (stageName === "stage_3_content") {
    applyContent(page, sections);
  }

  return {
    page,
    prompt: buildPrompt(stageName, bundle, previousApproved),
    context: {
      stageName,
      pageTitle: extractPageRequirementTitle(sections),
      sections: sections.map((section) => ({
        title: section.title,
        level: section.level,
        parentTitle: section.parentTitle,
        bullets: section.bullets,
        ordered: section.ordered
      })),
      previousApproved
    }
  };
}
