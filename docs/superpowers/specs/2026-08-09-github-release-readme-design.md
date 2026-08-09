# GitHub 首发与 README 设计

## 发布目标

把当前完整项目作为 `tail258/sound-garden-3d` 的首次公开版本发布。远端仓库为空，因此首个提交直接建立 `main` 分支，不创建无意义的 Pull Request。

## README 设计

README 面向黑客松评委和开源开发者，采用中文主体与英文摘要。视觉语言沿用应用现有的深绿标本实验台风格，内容顺序如下：

1. 品牌图标、中文标题、英文一句话简介与真实技术徽章。
2. 莲座形完整界面截图作为主视觉。
3. 项目定位和本地优先的隐私说明。
4. 声音到植物的 Mermaid 数据流。
5. 本地音频、Worker、可解释映射、确定性生长四项核心能力。
6. 树形、莲座形、群落形三张真实截图画廊。
7. 高度、粗壮度、扩张度、结构复杂度参数说明。
8. 快速开始、验证命令、技术栈与目录结构。
9. 已知限制和 MIT 许可证。

README 不添加不存在的在线演示、CI 状态或性能承诺，不使用营销模板文案，不隐藏项目已知限制。

## 图片资产

- `docs/assets/sound-garden-tree.png`：声音映射树形与人工覆盖检查器。
- `docs/assets/sound-garden-rosette.png`：莲座形完整实验台，作为主视觉。
- `docs/assets/sound-garden-colony.png`：群落形完整实验台。

图片来自用户提供的 2026-08-09 项目截图，保持原始比例和内容。

## 许可证

新增标准 MIT License：

`Copyright (c) 2026 tail258`

## Git 策略

- 远端：`https://github.com/tail258/sound-garden-3d.git`
- 分支：将当前无提交分支整理为 `main`。
- 范围：提交当前项目源代码、测试、说明文档、MIT License 与三张 README 截图。
- 排除：`node_modules`、`dist`、Playwright 报告、测试结果和本地日志继续由 `.gitignore` 排除。
- 提交信息：`Initial release of Sound Garden 3D`

## 发布验证

- `pnpm check` 全部通过。
- 针对 README 的链接和图片路径进行本地检查。
- 提交前审查 staged diff 和文件清单。
- 推送后用 GitHub CLI 核对默认分支、README、许可证识别和最新提交。
