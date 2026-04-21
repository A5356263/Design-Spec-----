# 文档-生成-评估

## 项目定位

这是一个文档驱动的页面生成链路平台，不是页面生成器。

- Code Agent 负责读取文档并生成各阶段 `candidate.page.json`
- 项目负责评估、冻结、回退、汇总与预览
- 项目代码不直接解析文档后生成页面
- 项目代码不提供脚本内 LLM 调用

## 关键真源

- `AGENT_ENTRY.md`
- `RESOURCE_MANIFEST.md`
- `input/design_spec.md`
- `input/constraints.md`
- `input/references.md`
- `FLAT_JSON_PROTOCOL.md`
- `config/ANT_LITE_CATALOG.json`
- `specs/`

## 执行方式

1. 外部 Code Agent 按 `AGENT_ENTRY.md` 阅读真源文档
2. Code Agent 为当前阶段生成 `candidate.page.json`
3. 执行 `npm run mainline`
4. 项目完成评估、冻结和最终汇总

## 快速开始

```bash
npm install
npm run mainline
npm run acceptance
```

## 说明

- 若缺少某阶段 `candidate.page.json`，`mainline` 会直接阻断
- `candidate.page.json` 必须由外部 Code Agent 提前落盘
