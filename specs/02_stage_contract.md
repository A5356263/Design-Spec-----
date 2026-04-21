# 02_stage_contract.md

## 1. 文件定位

本文件是三阶段边界真源。  
它定义：

- 每阶段正式产物是什么
- 每阶段允许填到什么程度
- 每阶段禁止做什么
- 每阶段评估重点是什么

---

## 2. 通用阶段规则

1. 正式产物都是 `page json`
2. 每阶段只允许在当前阶段目录中写入正式产物
3. 当前阶段通过稿是下一阶段唯一正式输入
4. 当前阶段不允许默认推翻上一阶段结构
5. 阶段越靠后，越偏内容补充，而不是结构重做

---

## 3. 阶段一：骨架阶段

### 目录
- `workdir/workspace/stage_1_skeleton/`

### 输入
- `input/design_spec.md`
- `input/constraints.md`

### 允许生成的内容
- 页面 root
- layout/container 节点
- 区域划分
- 层级关系
- children 关系
- 基础布局 props
- 标题占位
- 页面骨架留白与结构承载节点

### 禁止内容
- 真实业务字段
- 表格 `rows`
- 描述列表 `items`
- 真实 alert / tag / timeline 内容
- 大量业务文案
- 完整状态值

---

## 4. 阶段二：组件阶段

### 目录
- `workdir/workspace/stage_2_components/`

### 输入
- `workdir/workspace/stage_1_skeleton/approved.page.json`

### 允许生成的内容
- 真实组件类型
- 字段容器
- 表单结构
- 表格列定义
- 操作入口
- 结构性 props
- 基础说明型 props

### 禁止内容
- 推翻骨架
- 重排大区块
- 大量真实数据
- 复杂业务状态
- 直接重写页面 root 与主要 children 关系

---

## 5. 阶段三：内容阶段

### 目录
- `workdir/workspace/stage_3_content/`

### 输入
- `workdir/workspace/stage_2_components/approved.page.json`

### 允许生成的内容
- 文案
- `rows`
- `items`
- tag label
- descriptions 内容
- alert 内容
- timeline 内容
- progress / statistic 静态值
- 空状态
- 错误状态
- 禁用状态

### 禁止内容
- 推翻骨架
- 修改组件类型
- 重新划分区域
- 大幅变更 children 拓扑

---

## 6. 评估输出固定格式

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

---

## 7. 一句话总结

**本文件定义“每个阶段该做什么、不该做什么”；阶段越往后越偏补充，不允许用后阶段的自由度回头破坏前阶段已确认结构。**
