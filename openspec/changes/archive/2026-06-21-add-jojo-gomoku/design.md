## Context

`child-games` 是一个计划收录多个儿童游戏的 monorepo，目前是 100% 绿地项目（零提交、零代码、零依赖）。`wuziqi/` 是首个游戏目录，仅有 `resources/` 下 6 张角色 PNG（baba/mama/gege/jiejie/jojo/wolf，均为透明背景方形图，162-274px）。

目标用户：4 岁孩子 + 家长，亲子对战场景，主要设备 iPad（也要兼容桌面浏览器调试）。约束：纯网页、双击即开、零运行时依赖、无构建工具。

本设计基于 3 项并行调研：仓库现状、Gomoku 连线检测算法（参考 sen-ltd/gomoku-ai 等 6 个开源实现）、4 岁儿童教育游戏 UX（基于 Sesame Workshop、BBC GEL、W3C COGA、O'Keeffe 提示系统研究等 18 项来源）。

## Goals / Non-Goals

**Goals:**

- 让 4 岁孩子能理解并享受"五子连线"概念，通过家人排队的故事化重构降低认知门槛
- 平板（iPad）触控体验为一等公民，桌面浏览器兼容
- 连线提示系统作为"渐进式脚手架"，帮助孩子发现连线机会但可由家长关闭/淡化
- 纯 vanilla JS，无任何构建步骤，双击 `index.html` 即可玩
- 可作为 PWA "加入主屏幕"，孩子像开 App 一样进入

**Non-Goals:**

- ❌ 不做 AI 对手（亲子对战，父母手动控制狼方）
- ❌ 不做威胁检测（open 3 / open 4 等高级策略提示），4 岁不需要
- ❌ 不做在线对战 / 多人联机
- ❌ 不做账号系统、云存档、跨设备同步
- ❌ 不做难度等级（亲子对战由父母动态调节即可）
- ❌ 不支持传统 15×15 棋盘
- ❌ 不做音效外部资源文件（全部 Web Audio API 生成）
- ❌ 不做 i18n 框架（亲子本地玩，文案极少，直接硬编码）

## Decisions

### 决策 1：技术栈 — 纯 vanilla HTML/CSS/JS，多文件结构

**选择**：vanilla JS + 6 文件（index.html / style.css / game.js / hint.js / audio.js / manifest.json）

**理由**：
- 4 岁孩子的游戏不需要 React/Vue 的复杂度，也不需要构建工具
- 双击 `index.html` 即玩 — 对家长分享极友好
- 仓库无 package.json 依赖（仅占位骨架），保持零依赖
- 多文件而非单文件 — `resources/` 已经是外部目录，单文件无法自包含；多文件更易维护

**备选方案**：
- ❌ 单 HTML 文件 — 不能完全自包含（resources/ 是外部），且难维护
- ❌ React + Vite — 引入构建步骤、npm 依赖，违反"纯网页"约束
- ❌ Vue/Svelte — 同上

### 决策 2：游戏机制 — 家人轮换 + 狼固定，5 子连线判胜

**选择**：
- 孩子方（家人）：每回合按 `jojo → baba → mama → gege → jiejie` 循环出角色，每个角色可重复出现多次
- 大人方（狼）：每步都是 `wolf.png` 同一形象
- 任意 5 颗家人连线（不分是谁）= 孩子赢；5 颗狼连线 = 大人赢
- 9×9 棋盘（比传统 15×15 小，对 4 岁认知友好）
- 方向：横、竖、两条对角线（标准五子棋）

**理由**：
- 5 个家人对应"5 子连线"，数字与故事天然契合
- 轮换出角色增加情绪（"妈妈来啦！"），保留五子棋策略核心
- 9×9 既有策略空间又不过载
- 用户明确选择"输了就是输了"，不刻意让 AI 必输（亲子对战天然公平）

**备选方案**：
- ❌ 5 个家人各唯一（解谜向）— 已经不是五子棋
- ❌ 只用 JoJo + 狼两色 — 浪费 5 个角色资源的故事性

### 决策 3：连线提示算法 — previewLinesAt() 临时放置 + 4 方向扫描

**选择**：
```javascript
const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

function previewLinesAt(board, row, col, player) {
  // 1. 临时放置棋子
  board[row][col] = player;
  // 2. 4 方向扫描，每方向正反两侧收集同色连续棋子
  // 3. 返回 [{ direction, cells, length, openEnds }]
  // 4. 撤销临时放置
}
```

**理由**：
- 经典 4 方向扫描是 Gomoku 算法的标准范式（参考 sen-ltd/gomoku-ai）
- 9×9 性能 < 0.1ms 全盘扫描，hover/long-press 实时计算无压力
- 收集 `cells` 数组而非仅计数 — 直接用于 SVG 连线可视化
- `openEnds` 字段为未来可能的"威胁检测"扩展预留（本期不用）

**参考实现**：
- [sen-ltd/gomoku-ai `gomoku.js`](https://github.com/sen-ltd/gomoku-ai/blob/main/src/gomoku.js) — 最干净的 vanilla JS 实现
- [gkoos/gomoku `main.js`](https://github.com/gkoos/gomoku/blob/main/src/main.js) — `checkWin` 返回 cells 数组（用 unshift/push 保持视觉顺序）

### 决策 4：提示可视化 — SVG overlay + 整颗棋子光晕 + 计数点

**选择**：
- **SVG overlay** 覆盖在棋盘上，画曲线连接同色家人
- **整颗棋子黄色光晕**（2Hz 亮度脉冲，单色不换色）— 整体高亮而非箭头
- **计数点**（N 个点而非阿拉伯数字）排列在连线下方
- **撒花粒子**仅在 N ≥ 3 时出现
- 触发：桌面 `hover` / 触屏 `touchstart + 300ms` 延时

**理由（含研究引用）**：
- **颜色是 4 岁最敏感线索**（高于形状）— Journal of Experimental Child Psychology, "Colorful success" (2012)
- **4 岁对动态有"跳出效应"**（自动注意，无需主动寻找）— Hofrichter & Rutherford, Perception (2019)
- **注意力是"物体偏向"** — 高亮整颗棋子比箭头更有效 — Child Development (2017)
- **2Hz 是 4 岁天然共振频率** — 儿童音乐节拍研究 N=421（低于 3Hz 也避开光敏阈值）
- **数字用点不用阿拉伯数字** — 多数 4 岁孩子能口手对应数数但不能可靠识别数字符号
- **颜色 + 简单亮度脉冲 > 颜色 + 复杂运动** — 4 岁颜色-动作整合能力弱于亮度-动作（Lynn et al. 2020）

**备选方案**：
- ❌ CSS class swap 高亮格子 — 不如 SVG 画连线直观
- ❌ Canvas 绘制 — SVG 声明式更易维护，且无需重绘循环
- ❌ 阿拉伯数字 — 4 岁不能可靠识别
- ❌ 多色彩虹脉冲 — 颜色-动作整合对 4 岁过载

### 决策 5：提示三档强度 + 默认 FULL

**选择**：
- `OFF`：无提示，纯自由探索
- `SUBTLE`：仅静态黄色光晕（不画线、无撒花、无音效）
- `FULL`：光晕 + SVG 连线 + 计数点 + 撒花 + 音效
- 首次打开默认 `FULL`

**理由（含研究引用）**：
- **O'Keeffe 等"提示系统可能损害学习"**（BrainPOP 大规模研究，N=数千）：所有提示条件下的孩子表现都比无提示组差；但纯无提示对 Gomoku 这种复杂概念 = 孩子乱放
- **FTS 框架（Fine-Tuning System）**：提示必须"渐进淡化"（fading），否则产生"专家反转效应"
- 结论：4 岁 Gomoku 需要初始强提示帮孩子建立"连线"概念，但必须可淡化/关闭
- 默认 FULL 的理由：首次接触的孩子需要建立概念；玩熟后家长手动调低

### 决策 6：不对称提示 — 仅孩子方有提示

**选择**：孩子方（家人）可开启连线提示；大人方（狼）无任何提示。

**理由**：
- 亲子对战，大人不需要 AI 辅助
- 让孩子在"思考资源"上有优势是公平的（大人本来就有压倒性策略优势）
- 简化实现：只检测家人方的潜在连线

### 决策 7：触控优先 — 60px 触摸目标 + palm rejection + PWA

**选择**：
- 棋盘格子 60×60px（4 岁 motor 控制弱，>Apple HIG 44px 标准）
- 多指只识别第一指（palm rejection）
- `touch-action: none` + `overscroll-behavior: contain` 防误触滚动/缩放
- 长按 300ms 触发提示（替代桌面 hover）
- 横竖屏均支持（CSS media query 自适应按钮位置）
- PWA：`manifest.json` + Apple touch icon meta + `display: standalone`，可"加入主屏幕"

**理由（含研究引用）**：
- **Sesame Workshop 学龄前触屏指南**：触控目标要大、hot spots 要明确、触控时间要宽容
- 4 岁 motor 技能未发育完全，44px 标准针对成人/大孩子
- PWA 让家长"加入主屏幕"后孩子像开 App 一样进入，符合 Sesame Workshop 强调的"无摩擦体验"
- 平板是主战场（用户明确选择"平板优先"）

### 决策 8：音效 — Web Audio API 生成，无外部文件

**选择**：
- 落子声（短促木鱼/水滴音）
- 连线欢呼（N≥3 时上行音阶）
- 胜利乐句（5 音符旋律）
- 全部用 Web Audio API 实时合成（OscillatorNode + GainNode）
- 首次点击解锁 AudioContext（iOS/Android 浏览器要求用户交互）
- 家长设置中可独立开关音效

**理由（含研究引用）**：
- **Harvard Reach Every Reader 研究**（N=240 学龄前）：脚手架式音效反馈显著提升准确率
- **Sesame Workshop**：音效对学龄前极其重要，"语言无关"的音效（'ding' / 'bong'）对全球孩子有效
- 无外部音频文件 → 保持纯网页、零资源依赖、加载快
- Web Audio API 生成音色简单但够用（不追求专业音质，追求反馈及时）

### 决策 9：家长控制 — baby gate 保护设置面板

**选择**：
- 角落小字灰色"Parents"按钮（不显眼，孩子不易注意）
- 点击后进入 baby gate：按住 3 秒倒计时（"3...2...1..."）才进入设置
- 设置项：提示档位（OFF/SUBTLE/FULL）、音效开关
- 设置通过 `localStorage` 持久化

**理由（含研究引用）**：
- **Sesame Workshop**：家长控制必须用"baby gate"保护，按钮要"不诱人"
- **NN/g 儿童 UX**：用"纯文字 footer"埋家长入口，孩子不识字会忽略
- **W3C COGA 模式**：使用熟悉符号（💡）+ 简单单含义图标
- localStorage 足够（无账号系统、单设备、本地玩）

## Risks / Trade-offs

- **[风险] 60px 格子导致 9×9 棋盘在小屏手机上溢出** → Non-Goal 已明确：手机不是目标设备。但桌面浏览器调试时缩放即可。可加 `viewport` meta 防止 mobile 拉伸。
  
- **[风险] 长按 300ms 触发提示可能与系统长按手势冲突（iOS 文本选择菜单）** → 用 `user-select: none` + `-webkit-touch-callout: none` + `touch-action: none` 全面禁用。

- **[风险] SVG overlay 在响应式布局中需要重新计算坐标** → 监听 `resize` 事件重绘；或用百分比坐标（基于棋盘宽度的相对值），避免绝对像素。

- **[风险] O'Keeffe 研究显示提示损害学习 — 默认 FULL 可能加剧这个问题** → 三档可调 + 家长指南文案（"玩熟后建议调低"）。V2 可考虑自适应淡化（连续赢 N 局自动降档），本期不做。

- **[风险] Web Audio 生成音效音质粗糙可能显得廉价** → 这是合理的取舍：纯网页 + 零依赖 + 即时反馈 > 专业音质。亲子场景家长更在意互动而非音质。

- **[权衡] 家人轮换固定顺序（jojo 开头）vs 随机** → 选固定顺序，可预测性对 4 岁更友好（孩子能预期"下一个是爸爸"）。

- **[风险] 不做威胁检测意味着孩子可能输给会玩的大人** → 用户已选"输了就是输了"。亲子对战天然有父母动态调节（父母可以"下臭棋"让孩子赢）。

- **[权衡] 无 Service Worker 离线缓存** → manifest.json 让 PWA 可安装，但不做完整离线。第一次加载后浏览器缓存基本够用。离线体验是 V2 可能的增强。

## Migration Plan

不适用 — 仓库无既有功能。首次部署即新增 `wuziqi/` 目录。

## Open Questions

无 — 所有关键设计决策已在探索阶段与用户确认完毕。

可选的 V2 探索方向（不影响本期实现）：
- 自适应提示淡化（连续赢 N 局自动降档）
- Service Worker 离线缓存
- 家人轮换顺序可家长自定义
- 多种棋盘皮肤（木纹/纸质/卡通）
- 游戏统计（玩了几局、胜率）— 需家长面板展示
