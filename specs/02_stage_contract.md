# Stage Contract

## 阶段一

- 输入：真源文档
- 输出：`workdir/workspace/stage_1_skeleton/candidate.page.json`
- 边界：只体现页面骨架、布局容器、模块容器

## 阶段二

- 输入：阶段一通过稿 + 真源文档
- 输出：`workdir/workspace/stage_2_components/candidate.page.json`
- 边界：补齐组件类型、按钮、表单、表格、标签等结构
- 约束：不得推翻阶段一的大区块结构

## 阶段三

- 输入：阶段二通过稿 + 真源文档
- 输出：`workdir/workspace/stage_3_content/candidate.page.json`
- 边界：补齐静态内容、示例数据、汇总信息
- 约束：不得修改已确认的组件类型与 children 拓扑
