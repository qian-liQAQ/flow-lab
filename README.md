# Flow Lab

**从零推导网络流算法的交互式中文课程。**

Flow Lab 用可操作的图形、引导式问题与循序渐进的 C++ 实现，帮助学习者理解最大流，而不仅是记忆算法模板。

## 在线学习

**课程网址：** https://qian-liqaq.github.io/flow-lab/

首次启用时，需要在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**；发布工作流成功后上述网址才可访问。

## 课程目录

| 章节 | 内容 |
| --- | --- |
| 01 | 容量与流量 |
| 02 | 流量守恒 |
| 03 | 合法流判断 |
| 04 | 贪心的陷阱 |
| 05 | 反向残量边 |
| 06 | 单边残量实验 |
| 07 | 完整残量网络 |
| 08 | Ford–Fulkerson：DFS/BFS 逐步搜索 |
| 09 | Edmonds–Karp：最短路与复杂度 |
| 10 | 为什么需要分层图 |
| 11 | Dinic：阻塞流 |
| 12 | 从零构建基础 Dinic C++ 实现 |

可以通过侧边栏直接跳转章节。切换章节会重新初始化该节实验。

## 本地运行

需要 Node.js 22 或更新的兼容版本。

```bash
git clone https://github.com/qian-liQAQ/flow-lab.git
cd flow-lab
npm ci
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

## 技术栈

Vite + TypeScript + 原生 HTML/CSS/SVG；没有大型前端框架依赖。

## 部署

推送到 `main` 后，GitHub Actions 工作流 `.github/workflows/deploy.yml` 会自动：

1. 安装依赖并运行 TypeScript/Vite 生产构建。
2. 上传 `dist/` 中的静态资源。
3. 部署至 GitHub Pages。

查看部署状态：[GitHub Actions](https://github.com/qian-liQAQ/flow-lab/actions)。

## 项目说明

这是面向算法初学者与竞赛学习者的教学项目。第一版聚焦最大流概念、残量网络与未加入当前弧优化的基础 Dinic；更深入的优化可在后续版本添加。

欢迎通过仓库 Issues 反馈教学建议或问题。
