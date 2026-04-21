# Resource Manifest

## 真源文件

- `AGENT_ENTRY.md`
- `AGENT_STAGE_TASK_TEMPLATE.md`
- `input/design_spec.md`
- `input/constraints.md`
- `input/references.md`
- `FLAT_JSON_PROTOCOL.md`
- `config/ANT_LITE_CATALOG.json`
- `specs/01_mainline_contract.md`
- `specs/02_stage_contract.md`
- `specs/03_snapshot_contract.md`

## 运行目录

- `workdir/current_run.json`
- `workdir/runs/<run_id>/runtime/`
- `workdir/runs/<run_id>/runtime/snapshots/`
- `workdir/runs/<run_id>/workspace/stage_1_skeleton/`
- `workdir/runs/<run_id>/workspace/stage_2_components/`
- `workdir/runs/<run_id>/workspace/stage_3_content/`
- `workdir/runs/<run_id>/workspace/final/`

## 运行边界

- 项目不提供脚本内 LLM 调用能力
- 项目不提供页面理解器
- 项目不提供页面生成器
- 项目不提供语义评估器
- 所有脚本必须先读取 `workdir/current_run.json`
- `candidate.page.json` 由外部 Code Agent 落盘到当前 run
- `evaluation.md` 由外部 Code Agent 落盘到当前 run
- 项目脚本不得跨 run 读取或写入产物

## 执行命令

- `npm run new-run`
- `npm run mainline`
- `npm run acceptance`
