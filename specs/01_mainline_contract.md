# 01_mainline_contract.md

## 1. 文件定位

本文件是项目主链路规则真源。  
它定义：

- 主链路固定顺序
- 阶段推进条件
- 最小硬卡口
- 输入读取边界
- 当前阶段允许写入范围

---

## 2. 主链路固定顺序

1. 读取 `input/design_spec.md`
2. 读取 `input/constraints.md`
3. 生成阶段一候选稿
4. 评估阶段一候选稿
5. 不通过则仅修正阶段一候选稿
6. 通过则冻结阶段一通过稿
7. 基于阶段一通过稿进入阶段二
8. 生成阶段二候选稿
9. 评估阶段二候选稿
10. 不通过则仅修正阶段二候选稿
11. 通过则冻结阶段二通过稿
12. 基于阶段二通过稿进入阶段三
13. 生成阶段三候选稿
14. 评估阶段三候选稿
15. 不通过则仅修正阶段三候选稿
16. 通过则冻结阶段三通过稿
17. 汇总 `final.page.json`
18. 通过预览适配器查看页面效果

---

## 3. 最小硬卡口

### 硬卡口 1：没有上阶段通过稿，禁止进入下一阶段
- 阶段二启动前必须存在：
  - `workdir/workspace/stage_1_skeleton/approved.page.json`
- 阶段三启动前必须存在：
  - `workdir/workspace/stage_2_components/approved.page.json`

### 硬卡口 2：当前阶段只能写当前阶段目录
- 阶段一只允许写：
  - `workdir/workspace/stage_1_skeleton/`
- 阶段二只允许写：
  - `workdir/workspace/stage_2_components/`
- 阶段三只允许写：
  - `workdir/workspace/stage_3_content/`

### 硬卡口 3：`input/` 默认只读
主链路运行过程中，不得改写：
- `input/design_spec.md`
- `input/constraints.md`
- `input/references.md`

---

## 4. 阶段推进规则

1. 当前阶段只能读取规定输入
2. 当前阶段必须先产出 `candidate.page.json`
3. 当前阶段必须生成对应 `evaluation.md`
4. 只有评估通过后，才允许生成或覆盖 `approved.page.json`
5. 只有当前阶段存在有效 `approved.page.json`，才允许进入下一阶段

---

## 5. 最终汇总规则

当阶段三通过后，才允许生成：

- `workdir/workspace/final/final.page.json`
- `workdir/workspace/final/final-summary.md`

预览层只能读取阶段产物或最终产物，不得反写正式真源。

---

## 6. 一句话总结

**本文件定义“怎么推进”；所有阶段都必须按固定顺序前进，不允许跨阶段乱写、跳过冻结或反写输入真源。**
