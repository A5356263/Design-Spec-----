# preview

轻量静态预览层。

## 文件职责

- `preview.html`：本地预览页面壳子，提供 run、阶段、版本切换入口
- `renderer.js`：读取当前轮与指定 JSON，按 `root / elements / type / props / children` 递归渲染
- `styles.css`：提供基础静态样式，只服务于结构可读

## 只读边界

- 只读取 `workdir/current_run.json`
- 只读取 `workdir/runs/<run_id>/workspace/...` 下各阶段 JSON
- 不参与生成、评估、冻结、回退、汇总
- 不改协议，不反向写入任何产物

## 当前支持

- `stage_1_skeleton/candidate.page.json`
- `stage_1_skeleton/approved.page.json`
- `stage_2_components/candidate.page.json`
- `stage_2_components/approved.page.json`
- `stage_3_content/candidate.page.json`
- `stage_3_content/approved.page.json`
- `final/final.page.json`

## 使用方式

- 建议从仓库根目录启动一个本地静态服务后打开 `packages/preview/preview.html`
- 如果直接以 `file://` 打开，浏览器可能因本地文件读取限制导致 JSON 加载失败
