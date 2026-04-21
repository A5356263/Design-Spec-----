# AGENT ENTRY

## 项目定位

本项目是一个文档驱动的页面生成链路平台。

- 页面理解、页面生成、语义评估：由外部 Code Agent 负责
- 项目代码负责：规则真源、硬门卡、链路推进、冻结、回退、预览
- 项目代码不得直接解析文档后生成 `page json`
- 项目代码不得生成 `evaluation.md`

## 固定阅读顺序

1. `AGENT_ENTRY.md`
2. `RESOURCE_MANIFEST.md`
3. `AGENT_STAGE_TASK_TEMPLATE.md`
4. `input/design_spec.md`
5. `input/constraints.md`
6. `input/references.md`
7. `FLAT_JSON_PROTOCOL.md`
8. `config/ANT_LITE_CATALOG.json`
9. `specs/01_mainline_contract.md`
10. `specs/02_stage_contract.md`
11. `specs/03_snapshot_contract.md`

## 主链路执行方式

### 阶段一

1. Code Agent 读取真源文档
2. Code Agent 生成 `workdir/workspace/stage_1_skeleton/candidate.page.json`
3. Code Agent 生成 `workdir/workspace/stage_1_skeleton/evaluation.md`
4. 项目执行硬门卡与冻结流程

### 阶段二

1. Code Agent 读取 `stage_1_skeleton/approved.page.json` 与真源文档
2. Code Agent 生成 `workdir/workspace/stage_2_components/candidate.page.json`
3. Code Agent 生成 `workdir/workspace/stage_2_components/evaluation.md`
4. 项目执行硬门卡与冻结流程

### 阶段三

1. Code Agent 读取 `stage_2_components/approved.page.json` 与真源文档
2. Code Agent 生成 `workdir/workspace/stage_3_content/candidate.page.json`
3. Code Agent 生成 `workdir/workspace/stage_3_content/evaluation.md`
4. 项目执行硬门卡与冻结流程

### 最终

- 项目在阶段三通过并冻结后汇总 `final.page.json`

## 禁止事项

- 不要改写 `input/` 下的真源输入
- 不要私自扩展 `FLAT_JSON_PROTOCOL.md`
- 不要使用 `ANT_LITE_CATALOG.json` 之外的 type / props
- 不要跳过冻结直接推进下一阶段
- 不要让预览层反向修正页面结构
- 不要让项目脚本替你生成语义结论

## 冲突优先级

1. `input/` 下的业务真源
2. `FLAT_JSON_PROTOCOL.md`
3. `config/ANT_LITE_CATALOG.json`
4. `specs/*.md`
5. 其他说明文档
