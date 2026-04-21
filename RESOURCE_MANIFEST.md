# RESOURCE_MANIFEST.md

## 1. 文件定位

本文件是项目的**外部资源清单真源**。  
它只负责说明：

- 当前项目实际使用了哪些外部资源
- 这些资源的用途是什么
- 哪些资源允许使用
- 哪些资源明确不接入
- 资源是否属于主链路依赖

---

## 2. 当前项目资源策略

本项目当前采用：

**扁平 JSON 表达协议 + Ant Design 组件库 + 项目内轻量预览适配器**

因此，资源策略如下：

- 页面正式真源：项目自定义 `page json`
- 页面预览实现层：Ant Design
- 页面预览适配层：项目内部自建
- 不接 json-render 的 render 层
- 不引入额外 UI 组件库
- 不引入重型状态管理库

---

## 3. 允许使用的资源

### `antd`
- 角色：UI 组件实现层
- 用途：真实页面预览、Ant Lite type 映射、默认样式
- 是否主链路依赖：是

### `@ant-design/icons`
- 角色：图标资源补充包
- 用途：按钮、提示、状态图标
- 是否主链路依赖：是（轻依赖）

### `react`
- 角色：预览页面基础运行环境
- 是否主链路依赖：是

### `react-dom`
- 角色：React 页面挂载运行环境
- 是否主链路依赖：是

---

## 4. 明确不接入的资源

### json-render render 层相关资源
- `@json-render/react`
- `@json-render/core`
- json-render renderer / provider / registry 运行时
- json-render action / state binding 机制

原因：
- 本项目只借 json-render 的**扁平 JSON 表达逻辑**
- 不使用其 render 运行时

### 其他 UI 组件库
- Material UI
- Chakra UI
- shadcn/ui
- Element Plus
- 其他 UI library

### 重型状态管理库
- Redux
- MobX
- Zustand（当前阶段也不作为前置依赖）

---

## 5. 资源使用边界

### 协议层
- `FLAT_JSON_PROTOCOL.md`
- `ANT_LITE_CATALOG.json`

### 预览层
- `antd`
- `@ant-design/icons`
- `react`
- `react-dom`

### 规则层
- `specs/`
- `FLAT_JSON_PROTOCOL.md`
- `ANT_LITE_CATALOG.json`

---

## 6. 最小安装清单

```bash
npm install antd @ant-design/icons
```

---

## 7. 一句话总结

**本文件只回答一个问题：当前项目到底允许用哪些外部资源来实现预览与运行边界。**
