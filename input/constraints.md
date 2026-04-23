# 约束条件

## 协议约束
- 必须输出为当前项目使用的扁平 page json
- 必须遵守 root / elements / type / props / children 结构
- 不允许私自扩展协议结构

## 组件约束
- 必须使用当前项目允许的 Ant Lite type
- 不允许使用 catalog 中未声明的 type
- 不允许使用 catalog 中未声明的 props

## 规则约束
- 必须遵守 `specs/01_mainline_contract.md`
- 必须遵守 `specs/02_stage_contract.md`
- 必须遵守 `specs/03_snapshot_contract.md`

## 主链路约束
- 当前阶段只生成当前阶段 `candidate.page.json`
- 当前阶段必须由外部 Code Agent 自行生成 `evaluation.md`
- 不允许跳过阶段直接生成最终页
- 不允许在后阶段推翻前阶段已通过结构
- 不允许改写 `input/` 下真源文档

## 评估约束
- `evaluation.md` 必须由外部 Code Agent 生成
- 必须明确写出：是否通过：通过 / 不通过
- 若不通过，必须列出问题和修改指令
- 若通过，才允许项目脚本冻结当前阶段

## 结构约束
- 页面固定为：顶部区 + 左右主体区 + 底部区
- 左侧为主要填写区
- 右侧为辅助信息区
- 不允许改成单栏
- 不允许改成多标签页结构

## 测试目标
- 当前测试目标是验证“外部 Code Agent 生成 + 项目硬门卡推进”是否成立
- 优先稳定、规整、可评估
- 优先验证阶段协作是否正确，不追求复杂创意表现