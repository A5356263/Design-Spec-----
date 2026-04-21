# 文档-生成-评估

## 项目说明

这是一个用于“文档生成与评估流程”演示的最小可运行项目，包含：

- 分阶段产物目录（`workdir/workspace`）
- 运行时状态目录（`workdir/runtime`）
- 预览与流程代码（`packages`）
- 业务输入文件（`input`）

已移除建设期规范文档，仅保留运行所需文件。

## 目录结构

```text
文档-生成-评估/
├── README.md
├── package.json
├── package-lock.json
├── input/
├── packages/
└── workdir/
```

## 快速开始

```bash
npm install
npm run mainline
npm run acceptance
```

## 说明

- 根目录仅保留总 `README.md`。
- 关键子目录提供简短 `README.md` 说明用途。
