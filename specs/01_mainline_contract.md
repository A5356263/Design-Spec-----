# Mainline Contract

## 目标

定义项目主链路只负责推进流程，不负责生成页面。

## 主链路职责

- 先读取 `workdir/current_run.json` 并定位当前 run
- 读取当前 run 的运行时状态并确定当前阶段
- 检查当前阶段 `candidate.page.json` 是否存在
- 检查当前阶段 `evaluation.md` 是否存在
- 检查上一阶段 `approved.page.json` 是否满足硬卡口
- 执行协议、catalog、阶段边界等硬门卡检查
- 读取外部 Agent 写入的 `evaluation.md`
- 若 `evaluation.md` 为“通过”则冻结为 `approved.page.json`
- 若 `evaluation.md` 为“不通过”则停留当前阶段
- 阶段三完成后汇总 `final.page.json`

## 非职责

- 不解析设计文档决定页面结构
- 不在代码中直接生成 `candidate.page.json`
- 不在代码中直接生成 `evaluation.md`
- 不在代码中做页面语义判断
- 不在脚本内调用模型

## 阻断条件

- 缺少当前阶段 `candidate.page.json`
- 缺少当前阶段 `evaluation.md`
- 缺少上一阶段通过稿
- 存在未解决的回退记录
- 当前阶段硬门卡不通过
- `current_run.json` 缺失或非法
