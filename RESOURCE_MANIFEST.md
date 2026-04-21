# Resource Manifest

## 真源文件

- `input/design_spec.md`
- `input/constraints.md`
- `input/references.md`
- `FLAT_JSON_PROTOCOL.md`
- `config/ANT_LITE_CATALOG.json`
- `specs/01_mainline_contract.md`
- `specs/02_stage_contract.md`
- `specs/03_snapshot_contract.md`

## 运行目录

- `workdir/workspace/stage_1_skeleton/`
- `workdir/workspace/stage_2_components/`
- `workdir/workspace/stage_3_content/`
- `workdir/workspace/final/`
- `workdir/runtime/`

## 运行边界

- 项目不提供脚本内 LLM 调用能力
- 项目不提供页面理解器
- 项目不提供页面生成器
- `candidate.page.json` 由外部 Code Agent 落盘

## 执行命令

- `npm run mainline`
- `npm run acceptance`
