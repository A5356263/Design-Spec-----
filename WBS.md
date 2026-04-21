# WBS.md

## 1. 执行目标

本执行清单的目标，是把方案落成一个**可运行、可预览、可评估、可冻结**的最小闭环项目。

执行原则：

- 不一次做大
- 先跑通主链路
- 先只做 Ant Lite
- 先只做静态页面预览
- 先只支持三阶段固定推进

---

## 2. 执行分组总览

1. 项目骨架建立
2. 资源拉取与资源记录
3. 协议文件建立
4. Ant Lite 允许集建立
5. 三阶段工作区建立
6. 预览适配器建立
7. 主链路与评估冻结建立
8. 首个页面闭环验证

---

## 3. WBS 明细

### WBS-01｜项目骨架建立
- 新建项目根目录
- 建立 `specs/`
- 建立 `input/`
- 建立 `packages/`
- 建立 `workdir/workspace/`
- 建立 `workdir/runtime/`

### WBS-02｜资源拉取与资源记录
- 安装 Ant Design
- 安装 `@ant-design/icons`
- 若项目尚未有 React 基础依赖，则补 React / React DOM
- 创建 `RESOURCE_MANIFEST.md`

### WBS-03｜扁平 JSON 协议文件建立
- 创建 `FLAT_JSON_PROTOCOL.md`
- 定义 `root / elements / type / props / children`
- 写明不使用 json-render render 层

### WBS-04｜Ant Lite 允许集建立
- 创建 `ANT_LITE_CATALOG.json`
- 定义允许的 `type`
- 定义每个 `type` 允许的最小 props
- 标注阶段可用范围

### WBS-05｜三阶段工作区建立
创建：

#### `workdir/workspace/stage_1_skeleton/`
- `candidate.page.json`
- `approved.page.json`
- `evaluation.md`
- `meta.json`

#### `workdir/workspace/stage_2_components/`
- `candidate.page.json`
- `approved.page.json`
- `evaluation.md`
- `meta.json`

#### `workdir/workspace/stage_3_content/`
- `candidate.page.json`
- `approved.page.json`
- `evaluation.md`
- `meta.json`

#### `workdir/workspace/final/`
- `final.page.json`
- `final-summary.md`

### WBS-06｜预览适配器建立
- 建立 `packages/preview/`
- 建立 Ant Lite type 到 Ant 组件的映射表
- 建立递归节点渲染能力
- 建立 stage 预览页面

### WBS-07｜主链路、评估、冻结建立
- 建立 `mainline.ts`
- 建立 `stage_skeleton.ts`
- 建立 `stage_components.ts`
- 建立 `stage_content.ts`
- 建立 `evaluate.ts`
- 建立 `freeze.ts`
- 建立 `workdir/runtime/state.json`
- 建立 `workdir/runtime/run_log.md`

### WBS-08｜首个页面闭环验证
- 准备一个 `design_spec.md`
- 跑通阶段一
- 跑通阶段二
- 跑通阶段三
- 输出 `final.page.json`
- 用预览适配器检查最终页面

---

## 4. 优先级建议

### P0
- WBS-01
- WBS-02
- WBS-03
- WBS-04
- WBS-05

### P1
- WBS-06
- WBS-07

### P2
- WBS-08

---

## 5. 最小安装清单

```bash
npm install antd @ant-design/icons
```

注意：
- 当前不拉 json-render 运行时资源
- 当前不拉额外 UI 库
- 当前不拉大型状态管理库

---

## 6. 完成判定

1. 根目录资源文件齐全
2. 三份 spec 齐全
3. Ant Lite catalog 可被读取
4. 三阶段都能输出合法 page json
5. 预览适配器可读取各阶段 json 并渲染真实页面
6. 三条硬卡口生效
7. 至少跑通一个真实页面
