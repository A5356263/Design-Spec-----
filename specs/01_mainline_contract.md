# Mainline Contract

## 目标

定义项目主链路只负责推进流程，不负责生成页面。

## 主链路职责

- 按阶段顺序执行 `stage_1_skeleton -> stage_2_components -> stage_3_content`
- 检查当前阶段 `candidate.page.json` 是否存在
- 检查上一阶段 `approved.page.json` 是否满足硬卡口
- 调用评估器生成 `evaluation.md`
- 评估通过后冻结为 `approved.page.json`
- 阶段三完成后汇总 `final.page.json`

## 非职责

- 不解析设计文档决定页面结构
- 不在代码中直接生成 `candidate.page.json`
- 不在脚本内调用模型

## 阻断条件

- 缺少当前阶段 `candidate.page.json`
- 缺少上一阶段通过稿
- 存在未解决的回退记录
- 当前阶段评估不通过
