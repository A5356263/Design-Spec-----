# README.md

## 1. 文件定位

本文件是**给 Code Agent 使用的项目启动文档**。  
它只负责两件事：

1. 说明这个项目要搭成什么
2. 规定 Code Agent 的固定阅读顺序与执行边界

本文件不是：

- 页面协议真源
- 组件允许集真源
- 阶段规则法典
- 页面正式产物

如果本文件与真源文件冲突，以真源文件为准。

---

## 2. 项目目标

请搭建一个最小闭环的 AI 页面生成项目，路线固定为：

**扁平 JSON 表达协议 + Ant Design 组件实现层 + Ant Lite 允许集 + 分阶段生成 + 项目内预览适配器**

项目要求：

- 只借鉴 json-render 的**扁平 JSON 表达逻辑**
- 不接入 json-render 的 render 层
- 阶段正式产物必须是 `page json`
- 每个阶段都可以通过项目内预览看到真实页面效果
- 使用 Ant Design 作为当前实现层
- 使用 Ant Lite 允许集限制合法 type / props
- 使用三阶段推进：骨架 → 组件 → 内容

---

## 3. 先理解分层，不要混淆

### 3.1 指导文档
这些文件用于指导你搭建项目，不是项目运行真源：

- `README.md`
- `WBS.md`

### 3.2 真源文件
这些文件是项目后续会直接依赖的规则与协议真源：

- `RESOURCE_MANIFEST.md`
- `FLAT_JSON_PROTOCOL.md`
- `ANT_LITE_CATALOG.json`
- `specs/01_mainline_contract.md`
- `specs/02_stage_contract.md`
- `specs/03_snapshot_contract.md`

### 3.3 输入真源
这些文件提供业务页面输入：

- `input/design_spec.md`
- `input/constraints.md`
- `input/references.md`（可选）

### 3.4 运行产物区
这些目录用于后续生成阶段产物：

- `workdir/workspace/`
- `workdir/runtime/`

---

## 4. 固定阅读顺序

你必须按以下顺序阅读文件，不要跳读，不要自行调整优先级。

### 第一步：先读启动文档
1. `README.md`

### 第二步：读执行清单
2. `WBS.md`

### 第三步：读资源边界
3. `RESOURCE_MANIFEST.md`

### 第四步：读业务输入
4. `input/design_spec.md`
5. `input/constraints.md`
6. `input/references.md`（如果存在且需要）

### 第五步：读协议与组件允许集
7. `FLAT_JSON_PROTOCOL.md`
8. `ANT_LITE_CATALOG.json`

### 第六步：读规则法典
9. `specs/01_mainline_contract.md`
10. `specs/02_stage_contract.md`
11. `specs/03_snapshot_contract.md`

### 第七步：进入当前阶段目录执行
12. 当前阶段目录下的：
- `meta.json`
- `candidate.page.json`
- `approved.page.json`
- `evaluation.md`

---

## 5. 你当前要搭建的项目结构

```text
你的项目名/
├── README.md
├── WBS.md
├── RESOURCE_MANIFEST.md
├── FLAT_JSON_PROTOCOL.md
├── ANT_LITE_CATALOG.json
├── specs/
│   ├── 01_mainline_contract.md
│   ├── 02_stage_contract.md
│   └── 03_snapshot_contract.md
├── input/
│   ├── design_spec.md
│   ├── constraints.md
│   └── references.md
├── packages/
│   ├── mainline.ts
│   ├── stage_skeleton.ts
│   ├── stage_components.ts
│   ├── stage_content.ts
│   ├── evaluate.ts
│   ├── freeze.ts
│   └── preview/
│       ├── ant-lite-registry.tsx
│       ├── render-node.tsx
│       ├── preview-shell.tsx
│       └── stage-preview-page.tsx
└── workdir/
    ├── workspace/
    │   ├── stage_1_skeleton/
    │   │   ├── candidate.page.json
    │   │   ├── approved.page.json
    │   │   ├── evaluation.md
    │   │   └── meta.json
    │   ├── stage_2_components/
    │   │   ├── candidate.page.json
    │   │   ├── approved.page.json
    │   │   ├── evaluation.md
    │   │   └── meta.json
    │   ├── stage_3_content/
    │   │   ├── candidate.page.json
    │   │   ├── approved.page.json
    │   │   ├── evaluation.md
    │   │   └── meta.json
    │   └── final/
    │       ├── final.page.json
    │       └── final-summary.md
    └── runtime/
        ├── state.json
        ├── run_log.md
        └── snapshots/
```

---

## 6. 固定执行原则

1. 不要把指导文档当成运行时代码
2. 不要把 README / WBS 当成真源法典
3. 不要修改输入真源
4. 不要跳过阶段冻结直接推进
5. 不要绕过协议真源私自扩展 type / props
6. 不要接入 json-render render 层
7. 不要引入额外 UI 组件库
8. 不要把预览层写成另一套规则系统

---

## 7. 一句话说明

**本 README 只负责指导 Code Agent 按顺序搭建项目；项目真正的规则、协议、资源边界，都以真源文件为准。**
