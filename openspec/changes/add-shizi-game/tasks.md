## 1. 项目骨架与素材准备

- [x] 1.1 创建 `shizi/` 目录结构（含 `data/`、`data/chars/`、`vendor/`、`resources/icons/` 子目录）
- [x] 1.2 下载 `hanzi-writer@3.7.3` 的 `dist/hanzi-writer.min.js` 到 `shizi/vendor/hanzi-writer.min.js`，验证文件大小约 36KB
- [x] 1.3 编写 bash 脚本批量从 `cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/<字>.json` 下载 100 个笔画数据到 `shizi/data/chars/<字>.json`
- [x] 1.4 验证 100 个笔画 JSON 文件全部下载成功（每个含 `strokes` 和 `medians` 数组），无 404
- [x] 1.5 创建 `shizi/data/words.js`，导出 `WORDS` 数组（100 字对象，每字含 `id/char/pinyin/level/tip` 5 字段，按 10 关主题分组）
- [x] 1.6 创建 `shizi/manifest.json`（PWA 配置，对齐 wuziqi 的 manifest 结构，替换 name/icons 路径）
- [x] 1.7 从 `wuziqi/resources/` 复制 JoJo PNG 到 `shizi/resources/jojo.png`（保持 IP 一致性）
- [x] 1.8 准备 PWA 图标（192×192、512×512）到 `shizi/resources/icons/`

## 2. 基础设施（克隆 wuziqi 模式）

- [x] 2.1 创建 `shizi/index.html` 外壳：viewport meta、manifest 链接、apple-touch-icon、返回大厅按钮、主界面 DOM 骨架（顶部进度条 + 三入口卡片 + 字幕）、`<script defer>` 按依赖顺序加载所有 JS
- [x] 2.2 创建 `shizi/style.css`：复用大厅暖黄主题（背景渐变、圆角卡片、pop 动画）、新增字卡样式（200px+ 字号）、选项卡样式（60px+ 字号、ABCD 布局）、进度条样式、贴纸墙样式
- [x] 2.3 创建 `shizi/audio.js`：克隆 wuziqi 的 Web Audio API 模块（落子/庆祝/胜利音效合成 + 首次交互解锁 AudioContext），新增 `speak(char)` 函数封装 `speechSynthesis.speak()`（含 cancel 防队列堆积、语速读取 `shizi:speechRate`、音效开关检查）
- [x] 2.4 在 `audio.js` 新增 `initSpeechSynthesis()` 函数：检测 `getVoices()` 中文支持、监听 `onvoiceschanged` 异步加载、设置全局 `ttsAvailable` 标志
- [x] 2.5 创建 `shizi/settings.js`：克隆 wuziqi 的家长控制模块（角落 Parents 按钮 + 3 秒 baby-gate 倒计时），新增设置项（音效开关、TTS 语速滑块 0.5-1.5、笔顺速度滑块 0.5-2.0、重置进度按钮 + 二次确认）
- [x] 2.6 验证 `shizi/index.html` 在浏览器中能正常加载（无 console 报错、各 JS 文件 200 加载、空界面可显示返回按钮）

## 3. 进度系统 (progress.js)

- [x] 3.1 创建 `shizi/progress.js`：定义 `DEFAULT_PROGRESS` 对象（version/unlockedLevel/words/errorBook/stickers/streak/stats 字段）
- [x] 3.2 实现 `loadProgress()`：从 `localStorage.getItem('shizi:progress')` 读取并 JSON.parse，失败/不存在则返回 DEFAULT_PROGRESS 副本
- [x] 3.3 实现 `saveProgress(progress)`：JSON.stringify 后立即 `setItem`，try/catch 包裹降级处理（配额超限/隐私模式）
- [x] 3.4 实现 `recordParentConfirmed(wordId)`：更新 `words[wordId].parentConfirmed=true`、保证 `stars>=1`、更新 `lastSeen`、调用 `saveProgress`
- [x] 3.5 实现 `recordListenCorrect(wordId)`：递增 `listenCorrect`、根据累计次数更新 stars（1次→2星，3次→3星）、满星时移出错字本、调用 `saveProgress`
- [x] 3.6 实现 `addToErrorBook(wordId)` 和 `removeFromErrorBook(wordId)`：维护 `errorBook` 数组去重、同步 `words[wordId].inErrorBook` 标志
- [x] 3.7 实现 `checkLevelUnlock()`：检查当前关 60% 字 stars>=2 则更新 `unlockedLevel`、触发通关庆典与贴纸记录
- [x] 3.8 实现 `updateStreak()`：每次进入游戏时根据 `lastPlayDate` 更新 `streak.current`（中断>1天重置为1）、每 7 天加贴纸
- [x] 3.9 实现 `resetProgress()`：清空 `shizi:progress` 键、内存进度重置为 DEFAULT_PROGRESS（保留 `shizi:soundEnabled` 等设置 key）

## 4. 听音选字模式 (choice.js)

- [x] 4.1 创建 `shizi/choice.js`：定义模式入口函数 `startChoiceMode(level)`，从 `words.js` 过滤指定 level 的 10 字
- [x] 4.2 实现 `generateQuestion()`：按 50% 概率从 `errorBook` 抽取目标字、50% 从当前关未满星字抽取；从同关随机抽 3 个不重复干扰字；4 个选项随机排序
- [x] 4.3 实现题目渲染：大喇叭动画区 + 「正在播放...」文案 + 「🔁 再听一次」按钮 + 4 个选项大字卡（A/B/C/D 标识）
- [x] 4.4 实现 `playQuestionSound()`：进入题目时自动 `speak(targetChar)`，显示播放动画
- [x] 4.5 实现选项点击处理：选对→播放庆祝动画（撒花 CSS）+ 庆祝音效 + `recordListenCorrect()` + 2 秒后下一题；选错→错误项变灰禁用 + 鼓励文案 + `addToErrorBook(targetChar)` + 不退出题目
- [x] 4.6 实现「再听一次」按钮：点击重新 `speak(targetChar)`，无次数限制
- [x] 4.7 实现题目间过渡动画：上一题答对后卡片淡出、下一题卡片淡入

## 5. 亲子认字模式 (recognize.js)

- [x] 5.1 创建 `shizi/recognize.js`：定义模式入口函数 `startRecognizeMode(level)`
- [x] 5.2 实现字卡渲染：屏幕中央 200px+ 字号汉字、字卡占屏宽 60%+
- [x] 5.3 实现 HanziWriter 集成：创建 `HanziWriter.create('stroke-stage', char, options)` 实例，配置 `showOutline:true`、`strokeColor`、`strokeAnimationSpeed`（读取 `shizi:strokeSpeed`）、`delayBetweenStrokes:600`、自定义 `charDataLoader` 从 `data/chars/<字>.json` 本地 fetch
- [x] 5.4 实现自动播放笔顺：字卡渲染后 300ms 内调用 `writer.animateCharacter()`，动画完毕 `then()` 链接 `speak(char)`
- [x] 5.5 实现「▶️ 重播笔顺」按钮：点击后 `writer.hideCharacter()` + `writer.animateCharacter()` 重播
- [x] 5.6 实现字卡点击触发发音：整个字卡区域可点击，触发 `speak(char)`
- [x] 5.7 实现家长判定双按钮：「✅ 会了」调用 `recordParentConfirmed()` + 轻奖励音效 + 加载下一字；「🌱 再练」调用 `addToErrorBook()` + 加载下一字
- [x] 5.8 实现 tip 文案显示：字卡下方 ≥18px 字号显示当前字 `tip` 字段
- [x] 5.9 实现 TTS 不可用降级：检测 `ttsAvailable===false` 时在字卡下方显示 `pinyin` 字段
- [x] 5.10 实现 HanziWriter 加载失败降级：`typeof HanziWriter === 'undefined'` 或 `charDataLoader` 失败时降级为纯文字字卡 + 发音（无笔顺），不阻塞游戏

## 6. 主控与正反馈 (game.js)

- [x] 6.1 创建 `shizi/game.js`：DOMContentLoaded 时调用 `init()`，初始化进度、音频、设置、渲染主界面
- [x] 6.2 实现主界面三入口卡片渲染：听音选字、亲子认字、我的字库；顶部显示「已学 N/100 · 第 X 关 · ⭐ 总数」进度条
- [x] 6.3 实现关卡选择子界面：列出 1-10 关，未解锁关卡显示 🔒 + 「完成第 N 关解锁」文案，已解锁关卡显示进度（X/10 字满星）
- [x] 6.4 实现模式间切换与进度保留：切换模式时进度从内存读取最新值，不重新加载 localStorage
- [x] 6.5 实现「我的字库」进度查看界面：100 字网格展示，每字显示当前星数（⭐⭐⭐/⭐⭐/⭐/未学），按关卡分组
- [x] 6.6 实现通关庆典动画：`checkLevelUnlock()` 触发首次通关时，全屏撒花 CSS 动画 + JoJo 跳跃 + 胜利音效，持续约 3 秒
- [x] 6.7 实现贴纸墙界面：展示已获得的 `days7`/`days30`/`levelClear` 贴纸，未获得的显示为灰色占位
- [x] 6.8 实现 `updateStreak()` 调用：游戏启动时调用，更新打卡状态，触发贴纸获得动画

## 7. 大厅接入与文档

- [x] 7.1 修改根 `index.html`：将第一个 `.game-card.placeholder` 替换为 `.game-card.active`，`href="shizi/index.html"`，配 JoJo 图标 + 「识字乐园」标题 + 「听一听，认一认，字宝宝跟你走」描述
- [x] 7.2 创建 `shizi/README.md`：游戏简介、文件结构、字库说明、HanziWriter 与 hanzi-writer-data 协议致谢（MIT + Arphic PL）、资源更新流程（如何批量下载更多字的笔画数据）、已知限制（无 Service Worker、TTS 依赖系统）
- [x] 7.3 在 README 添加「推荐设备」说明：iOS Safari 15+、Chrome Android 100+，需系统支持中文 TTS voice

## 8. 测试与验收

- [x] 8.1 手动测试主流程：进入游戏 → 听音选字答对/答错各一次 → 亲子认字播放笔顺 + 家长判定 → 返回大厅 → 进度保留
- [x] 8.2 测试 localStorage 持久化：玩几题后关闭浏览器、重开 → 进度、星星、错字本全部保留
- [x] 8.3 测试关卡解锁：手动 localStorage 设置第 1 关 6 字 stars=2 → 重载 → 第 2 关应解锁
- [x] 8.4 测试离线场景：DevTools Network 选 Offline → 重载游戏 → HanziWriter、笔画数据、发音全部正常工作（无远程请求）
- [x] 8.5 测试 TTS 降级：DevTools 模拟无中文 voice（或在不支持设备上）→ 应显示 pinyin 作视觉提示
- [x] 8.6 测试家长控制 baby-gate：3 秒长按才能进设置、重置进度需二次确认
- [x] 8.7 测试错字本：故意答错几字 → 错字本中应出现 → 后续出题应优先抽错字
- [x] 8.8 测试 iPad 触控：60px+ 触摸目标、palm rejection、防误触滚动/缩放
- [x] 8.9 测试 PWA 安装：Safari「加入主屏幕」后全屏启动、图标正确显示
- [x] 8.10 验收对照所有 spec 文件的 Requirements 与 Scenarios，逐一确认实现
