## Why

`child-games` 仓库已有一个游戏（JoJo 五子棋），大厅里还预留了 3 个「敬请期待」的卡片槽位。幼儿园小班（3-4 岁）孩子正处于识字敏感期，但市面上识字 App 普遍过度依赖图片资源、广告多、界面复杂。我们做一个**纯字音驱动**的轻量识字游戏 — 听发音选字、看字家长考、笔顺动画演示 — 零图片依赖、离线可用、家长可控，作为仓库的第二个游戏，同时验证「学习类」游戏在既有约定下的落地形态。

## What Changes

- 新增 `shizi/` 目录下完整的「识字乐园」游戏（仓库第二个游戏）
- **听音选字模式**：Web Speech API 播放汉字发音 → 4 个汉字选项（同关卡随机干扰）→ 选对庆祝、选错鼓励重试，孩子可独立玩
- **亲子认字模式**：显示巨大字卡 → 家长考孩子读音 → 点字听标准发音验证 → 家长判定「会了/再练」，需家长陪玩
- **笔顺播放**：认字模式下集成 HanziWriter（本地化部署，不走 CDN），逐笔动画演示汉字书写过程，播放完毕自动发音
- **进度系统**：100 字分 10 关（数字/自然/天地/身体/家庭/动作/颜色/动物/食物/常用），每字最多 3 星，60% 字达 2 星解锁下一关
- **正反馈循环**：错字本自动收录答错的字优先复习、连续 7 天打卡给贴纸、通关全屏撒花庆典
- **发音方案**：使用浏览器原生 `speechSynthesis` (Web Speech API)，零素材成本、零网络依赖
- **进度持久化**：localStorage 存储（对齐 `wuziqi:` 命名空间约定，前缀 `shizi:`）
- 大厅接入：替换根 `index.html` 中第一个 placeholder 卡片

## Capabilities

### New Capabilities

- `character-learning`: 核心识字机制 — 听音选字模式（发音+ABCD选项+答错不惩罚）与亲子认字模式（字卡+家长判定）的双模式切换
- `stroke-animation`: 笔顺播放系统 — HanziWriter 本地化集成、逐笔动画、播放速度可调、完毕自动衔接发音
- `progress-tracking`: 学习进度系统 — 100字/10关结构、3星评级、关卡解锁规则、错字本、打卡贴纸墙、通关庆典
- `character-content`: 字库数据约定 — 100字数据结构（char/pinyin/level/tip）、本地JSON存储、HanziWriter 笔画数据本地化

### Modified Capabilities

- `audio-feedback`: 新增 `speechSynthesis` 发音需求（与既有 Web Audio API 音效共存，互不冲突），新增语音语速可调需求

## Impact

- **新增代码**：`shizi/` 目录下约 10 个文件（index.html, style.css, game.js, choice.js, recognize.js, audio.js, progress.js, settings.js, manifest.json, README.md）
- **新增数据**：`shizi/data/words.js`（100字业务数据）+ `shizi/data/chars/*.json`（100个笔画数据，从 hanzi-writer-data 开源仓库下载）
- **新增本地依赖**：`shizi/vendor/hanzi-writer.min.js`（36KB，MIT 协议，从 npm 下载到本地，不走 CDN）
- **既有资源**：复用 `wuziqi/resources/` 下 JoJo PNG 形象（保持 IP 一致性），复用大厅暖黄主题样式
- **既有约定对齐**：克隆 `wuziqi/audio.js` / `wuziqi/settings.js` 的模块模式（IIFE + window 全局 + baby-gate），localStorage 使用 `shizi:` 前缀
- **依赖**：零运行时网络依赖（HanziWriter 本地化、笔画数据本地化、speechSynthesis 系统原生），保持「纯 vanilla JS、无构建工具」项目原则
- **大厅接入**：修改根 `index.html`，将第一个 `.game-card.placeholder` 替换为指向 `shizi/index.html` 的 `.game-card.active`
- **浏览器兼容性**：目标现代移动浏览器（Safari iOS 15+、Chrome Android 100+），需支持 Web Speech API（speechSynthesis）、Web Audio API、SVG、localStorage、PWA
- **协议合规**：HanziWriter 代码 MIT、笔画数据 Arphic Public License（未修改使用，商业安全，将在 README 致谢标注）
- **无破坏性变更**：不影响既有 wuziqi 游戏，仅替换大厅一个 placeholder
