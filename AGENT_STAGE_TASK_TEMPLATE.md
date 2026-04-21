# Agent Stage Task Template

## 阶段输入

- 当前 `run_id`
- 当前阶段目录
- 真源文档
- 上一阶段 `approved.page.json`（如适用）

## 阶段输出

- `candidate.page.json`
- `evaluation.md`

## 当前轮要求

- 先读取 `workdir/current_run.json`
- 只写入 `workdir/runs/<run_id>/workspace/...`
- 不要写入旧轮目录

## 阶段禁止事项

- 不要修改 `input/` 真源
- 不要绕过 `FLAT_JSON_PROTOCOL.md`
- 不要使用 catalog 允许集之外的组件
- 不要跳过当前阶段直接写下一阶段产物

## 阶段完成标准

- `candidate.page.json` 符合当前阶段目标
- `evaluation.md` 使用固定格式
- `evaluation.md` 明确写出“是否通过：通过 / 不通过”

## evaluation.md 格式

```md
# 评估结果

是否通过：通过 / 不通过

## 问题
1.
2.
3.

## 修改指令
1.
2.
3.
```
