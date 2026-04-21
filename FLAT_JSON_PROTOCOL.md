# FLAT_JSON_PROTOCOL.md

## 1. 文件定位

本文件是项目的**页面表达协议真源**。  
它定义当前项目使用的扁平 JSON 页面协议。

本协议只借鉴 **json-render** 的扁平 JSON 表达骨架：

- `root`
- `elements`
- `type`
- `props`
- `children`

本协议**不引入** json-render 的 render 层、provider、action、state binding 等运行逻辑。

---

## 2. 顶层结构

每个页面产物必须满足以下顶层结构：

```json
{
  "root": "page-root",
  "elements": {
    "page-root": {
      "type": "Flex",
      "props": {},
      "children": []
    }
  }
}
```

### `root`
- 必填
- 必须存在于 `elements`
- 必须指向一个合法节点

### `elements`
- 必填
- key 为节点 id
- value 为节点对象
- 不允许为空对象

---

## 3. 节点结构

```json
{
  "type": "Card",
  "props": {
    "title": "页面标题"
  },
  "children": ["node-a", "node-b"]
}
```

### `type`
- 必填
- 必须出现在 `ANT_LITE_CATALOG.json` 的允许集中
- 当前阶段必须允许使用该 type

### `props`
- 必填
- 可以为空对象
- 只允许出现当前 type 对应 catalog 中允许的 props

### `children`
- 必填
- 可以为空数组
- 数组中的每个 id 必须存在于 `elements`
- 不允许重复引用
- 不允许直接自引用

---

## 4. 节点命名规则

统一格式：

`{page}-{region}-{module}-{slot}-{index}`

规则：
- 全小写
- 使用短横线
- 不允许随机字符串
- 同一页面内不得重复

---

## 5. 合法性要求

一个合法的 page json 至少满足以下条件：

1. 顶层必须存在 `root`
2. 顶层必须存在 `elements`
3. `root` 必须存在于 `elements`
4. 每个节点必须有 `type`
5. 每个节点必须有 `props`
6. 每个节点必须有 `children`
7. `type` 必须在 `ANT_LITE_CATALOG.json` 中
8. `props` 只能使用 catalog 允许字段
9. `children` 中引用的节点必须存在

---

## 6. 阶段边界

### 阶段一：骨架阶段
允许内容：
- 页面 root
- 容器节点
- 布局节点
- 区域层级
- children 关系
- 基础布局 props
- 区域标题占位

禁止内容：
- 真实业务字段
- 表格 `rows`
- 描述列表 `items`
- 复杂业务文案
- 复杂状态内容

### 阶段二：组件阶段
允许内容：
- 真实组件类型
- 字段容器
- 表单结构
- 表格列定义
- 操作按钮
- 说明型 props

禁止内容：
- 推翻骨架结构
- 重排大区域
- 大量真实数据内容
- 完整业务状态内容

### 阶段三：内容阶段
允许内容：
- 文案
- `rows`
- `items`
- label
- descriptions 内容
- alert 内容
- timeline 内容
- progress / statistic 静态值
- 空状态 / 错误状态 / 禁用状态

禁止内容：
- 推翻骨架
- 修改组件类型
- 重新组织大区块结构

---

## 7. 非目标能力

当前不支持：

- `$state`
- `visible`
- 通用 actions
- watch / effects
- 表单双向绑定
- 跨节点联动
- 异步数据加载协议
- 通用 renderer provider 机制
- 全量主题系统表达

---

## 8. 真源优先级

1. `ANT_LITE_CATALOG.json`
2. `FLAT_JSON_PROTOCOL.md`
3. `specs/` 下正式规则文件
4. 各目录 `README.md`

---

## 9. 一句话说明

**本协议是本项目页面表达的唯一正式结构真源；它只定义页面 JSON 怎么长，不定义 json-render 的运行时。**
