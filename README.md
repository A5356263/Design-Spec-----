# 文档-生成-评估

## 项目定位

这是一个文档驱动的页面生成链路平台，不是页面生成器。

- Code Agent 负责读取文档、生成各阶段 `candidate.page.json`、并产出 `evaluation.md`
- 项目负责硬门卡、冻结、回退、汇总与预览
- 项目代码不直接解析文档后生成页面
- 项目代码不提供脚本内 LLM 调用
- 项目代码不提供语义评估
- 每轮任务通过 `workdir/current_run.json` 绑定到独立 `run_id`

## 关键真源

- `AGENT_ENTRY.md`
- `AGENT_STAGE_TASK_TEMPLATE.md`
- `RESOURCE_MANIFEST.md`
- `input/design_spec.md`
- `input/constraints.md`
- `input/references.md`
- `FLAT_JSON_PROTOCOL.md`
- `config/ANT_LITE_CATALOG.json`
- `specs/`

## 执行方式

1. 外部 Code Agent 按 `AGENT_ENTRY.md` 阅读真源文档
2. 执行 `npm run new-run`
3. Code Agent 为当前 run 的当前阶段生成 `candidate.page.json`
4. Code Agent 为当前 run 的当前阶段生成 `evaluation.md`
5. 执行 `npm run mainline`
6. 项目完成硬门卡、冻结和最终汇总

## 快速开始

```bash
npm install
npm run new-run
npm run mainline
npm run acceptance
```

## 说明

- 若缺少当前阶段 `candidate.page.json` 或 `evaluation.md`，`mainline` 会停留在当前阶段等待
- `candidate.page.json` 和 `evaluation.md` 都必须由外部 Code Agent 提前落盘到当前 run
- 新任务不需要清空旧结果，只需要创建新的 run
