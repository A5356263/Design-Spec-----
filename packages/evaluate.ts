import { readFile } from "node:fs/promises";
import path from "node:path";
import { EvaluationResult, PageSchema, StageName, toCatalogStage } from "./schema";

type CatalogTypeRule = { stage: string[]; props: string[] };
type AntLiteCatalog = {
  types: Record<string, CatalogTypeRule>;
};

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function parsePageSchema(raw: string): { page: PageSchema | null; parseError: string | null } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return { page: null, parseError: "候选稿不是合法对象。" };
    }
    return { page: parsed as PageSchema, parseError: null };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "未知错误";
    return { page: null, parseError: `候选稿 JSON 解析失败：${reason}` };
  }
}

function validateByProtocol(page: PageSchema, stageName: StageName, catalog: AntLiteCatalog): EvaluationResult {
  const issues: string[] = [];
  const instructions: string[] = [];
  const stage = toCatalogStage(stageName);

  if (!page.root || typeof page.root !== "string") {
    issues.push("顶层缺少 root。");
  }
  if (!isRecord(page.elements)) {
    issues.push("顶层缺少 elements 或格式错误。");
  }

  const elements = isRecord(page.elements) ? (page.elements as Record<string, unknown>) : {};
  const nodeIds = Object.keys(elements);
  if (nodeIds.length === 0) {
    issues.push("elements 不能为空。");
  }
  if (page.root && !elements[page.root]) {
    issues.push("root 未指向 elements 中的合法节点。");
  }

  for (const nodeId of nodeIds) {
    const rawNode = elements[nodeId];
    if (!isRecord(rawNode)) {
      issues.push(`节点 ${nodeId} 结构错误。`);
      continue;
    }

    const type = rawNode.type;
    const props = rawNode.props;
    const children = rawNode.children;

    if (typeof type !== "string") {
      issues.push(`节点 ${nodeId} 缺少 type。`);
      continue;
    }
    if (!catalog.types[type]) {
      issues.push(`节点 ${nodeId} 使用了未允许的 type：${type}。`);
      continue;
    }
    if (!catalog.types[type].stage.includes(stage)) {
      issues.push(`节点 ${nodeId} 的 type=${type} 不允许出现在当前阶段 ${stage}。`);
    }

    if (!isRecord(props)) {
      issues.push(`节点 ${nodeId} 缺少 props 或 props 格式错误。`);
    } else {
      for (const propKey of Object.keys(props)) {
        if (!catalog.types[type].props.includes(propKey)) {
          issues.push(`节点 ${nodeId} 的 props.${propKey} 不在 ${type} 允许集内。`);
        }
      }
      if (stage !== "content" && ("rows" in props || "items" in props)) {
        issues.push(`节点 ${nodeId} 在 ${stage} 阶段包含 rows/items，违反阶段边界。`);
      }
    }

    if (!Array.isArray(children)) {
      issues.push(`节点 ${nodeId} 缺少 children 或 children 不是数组。`);
      continue;
    }
    const unique = new Set<string>();
    for (const childId of children) {
      if (typeof childId !== "string") {
        issues.push(`节点 ${nodeId} children 包含非字符串节点引用。`);
        continue;
      }
      if (childId === nodeId) {
        issues.push(`节点 ${nodeId} 出现自引用。`);
      }
      if (unique.has(childId)) {
        issues.push(`节点 ${nodeId} children 包含重复引用 ${childId}。`);
      }
      unique.add(childId);
      if (!elements[childId]) {
        issues.push(`节点 ${nodeId} children 引用了不存在的节点 ${childId}。`);
      }
    }
  }

  if (issues.length > 0) {
    instructions.push("按协议补齐 root/elements/type/props/children 必填项。");
    instructions.push("按类型允许集清理非法 props，并移除越阶段字段。");
    instructions.push("修复 children 引用关系，确保不自引用、不重复且可达。");
  } else {
    instructions.push("保持当前结构，允许进入冻结。");
    instructions.push("继续推进下一阶段并保持上阶段结构稳定。");
    instructions.push("更新运行日志与元数据。");
  }

  return { passed: issues.length === 0, issues, instructions };
}

export function formatEvaluationMarkdown(result: EvaluationResult): string {
  const issues = result.issues.length > 0 ? result.issues : ["无"];
  const instructions = result.instructions.length > 0 ? result.instructions : ["无", "无", "无"];

  return [
    "# 评估结果",
    "",
    `是否通过：${result.passed ? "通过" : "不通过"}`,
    "",
    "## 问题",
    ...issues.map((item, idx) => `${idx + 1}. ${item}`),
    "",
    "## 修改指令",
    ...instructions.map((item, idx) => `${idx + 1}. ${item}`)
  ].join("\n");
}

function sameStringArray(a: unknown, b: unknown): boolean {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((item, idx) => item === b[idx]);
}

function validateStructureStability(
  stageName: StageName,
  candidate: PageSchema,
  previousApproved: PageSchema | null
): string[] {
  if (!previousApproved) return [];

  const issues: string[] = [];
  if (candidate.root !== previousApproved.root) {
    issues.push(`当前阶段(${stageName})修改了 root，违反结构稳定要求。`);
  }

  const prevRoot = previousApproved.elements[previousApproved.root];
  const currRoot = candidate.elements[candidate.root];
  if (prevRoot && currRoot && !sameStringArray(currRoot.children, prevRoot.children)) {
    issues.push(`当前阶段(${stageName})修改了 root.children，违反大区块拓扑稳定要求。`);
  }

  if (stageName === "stage_3_content") {
    for (const nodeId of Object.keys(previousApproved.elements)) {
      const prev = previousApproved.elements[nodeId];
      const curr = candidate.elements[nodeId];
      if (!curr) {
        issues.push(`阶段三删除了上阶段节点 ${nodeId}。`);
        continue;
      }
      if (prev.type !== curr.type) {
        issues.push(`阶段三修改了节点 ${nodeId} 的组件类型(${prev.type} -> ${curr.type})。`);
      }
      if (!sameStringArray(prev.children, curr.children)) {
        issues.push(`阶段三修改了节点 ${nodeId} 的 children 拓扑。`);
      }
    }
  }

  return issues;
}

export async function evaluateCandidateFile(
  projectRoot: string,
  stageName: StageName,
  candidateFile: string,
  previousApprovedFile?: string
): Promise<EvaluationResult> {
  const raw = await readFile(candidateFile, "utf8");
  const { page, parseError } = parsePageSchema(raw);
  const catalogRaw = await readFile(path.join(projectRoot, "config/ANT_LITE_CATALOG.json"), "utf8");
  const catalog = JSON.parse(catalogRaw.replace(/^\uFEFF/, "")) as AntLiteCatalog;

  const result: EvaluationResult = parseError
    ? {
        passed: false,
        issues: [parseError],
        instructions: ["修复 candidate.page.json 的 JSON 结构。", "保持 root/elements 基本结构。", "完成修复后重新评估。"]
      }
    : validateByProtocol(page as PageSchema, stageName, catalog);

  if (!parseError && previousApprovedFile) {
    const prevRaw = await readFile(previousApprovedFile, "utf8");
    const prev = JSON.parse(prevRaw.replace(/^\uFEFF/, "")) as PageSchema;
    const stabilityIssues = validateStructureStability(stageName, page as PageSchema, prev);
    if (stabilityIssues.length > 0) {
      result.passed = false;
      result.issues.push(...stabilityIssues);
      result.instructions = [
        "保持上一阶段已确认结构，不要重排 root 与大区块关系。",
        "阶段三仅补充内容，不修改已存在节点 type 与 children 拓扑。",
        "按当前阶段边界修复后重新评估。"
      ];
    }
  }
  return result;
}
