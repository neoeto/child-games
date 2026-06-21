## Why

`child-games` 仓库目前是空的，需要第一个游戏来建立仓库的约定和形态。4 岁孩子喜欢超级宝贝 JoJo，把传统五子棋的"五子连线"重构成"JoJo 一家五口排队"的故事 — 让抽象的策略游戏变成有情绪、有角色的亲子互动体验。目标设备是 iPad（家长和孩子的主战场），纯网页实现便于分享，PWA 可"加入主屏幕"获得原生 App 般的体验。

## What Changes

- 新增 `wuziqi/` 目录下完整的五子棋游戏（仓库首个游戏，建立项目约定）
- 9×9 棋盘的亲子对战：孩子方为 JoJo 家人（5 个角色循环落子），大人方为狼（每步同一形象）
- "连线提示"系统：长按/hover 显示孩子方潜在连线（光晕 + SVG 连线 + 计数点 + 撒花），仅孩子方可用
- 三档提示强度（OFF / SUBTLE / FULL），默认 FULL，由家长在 baby-gate 保护的设置面板控制
- 平板触控优先体验：60px 触摸目标、palm rejection、防误触滚动/缩放、横竖屏自适应
- PWA 支持：manifest + meta 标签，可"加入主屏幕"全屏启动
- Web Audio API 生成的音效（落子、连线欢呼、胜利乐句），无外部音频文件
- 横竖屏均支持的响应式布局

## Capabilities

### New Capabilities

- `game-play`: 核心五子棋机制 — 9×9 棋盘、回合管理、家人轮换落子、狼方落子、五连线判胜、悔棋与重开
- `connection-hints`: 连线提示系统 — hover/长按触发、光晕/SVG 连线/计数点/撒花可视化、三档强度、仅孩子方可用
- `tablet-experience`: 平板触控体验 — 60px 触摸目标、palm rejection、防误触、横竖屏自适应、PWA 可安装
- `audio-feedback`: Web Audio 生成音效 — 落子声、连线欢呼、胜利乐句、可开关
- `parent-controls`: 家长控制 — baby-gate 保护的设置面板（提示档位、音效开关）、设置持久化

### Modified Capabilities

无（仓库无既有 spec）。

## Impact

- **新增代码**：`wuziqi/` 目录下约 6 个文件（index.html, style.css, game.js, hint.js, audio.js, manifest.json）
- **既有资源**：复用 `wuziqi/resources/` 下已有 6 张 PNG（baba/mama/gege/jiejie/jojo/wolf）
- **依赖**：零运行时依赖（纯 vanilla HTML/CSS/JS，无框架、无构建工具、无 npm 包）
- **仓库约定**：作为 `child-games` 仓库首个游戏，将确立后续儿童游戏的文件结构、命名规范、代码风格约定
- **浏览器兼容性**：目标为现代移动浏览器（Safari iOS 15+、Chrome Android 100+、桌面 Evergreen 浏览器），需支持 Web Audio API、Service Worker（PWA）、CSS Grid
- **无破坏性变更**：仓库无既有功能
