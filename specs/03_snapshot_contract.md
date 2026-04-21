# Snapshot Contract

## 快照要求

- 每个阶段必须保留 `candidate.page.json`
- 每个阶段评估后生成 `evaluation.md`
- 每个阶段通过后生成 `approved.page.json`
- 每个阶段必须维护 `meta.json`
- 运行时状态保存在 `workdir/runs/<run_id>/runtime/`
- 当前轮通过 `workdir/current_run.json` 定位

## 冻结要求

- `approved.page.json` 只能由当前阶段 `candidate.page.json` 冻结得到
- 冻结后视为下一阶段唯一结构真源

## 回退要求

- 回退必须显式记录来源阶段、目标阶段、原因与时间
- 未解决回退存在时，主链路不得继续推进
- 不得跨 run 读取或写回回退状态

## 只读要求

- `input/` 为只读真源
- 预览层只读渲染，不反向改写产物
