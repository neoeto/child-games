## 1. 项目脚手架与静态布局

- [x] 1.1 创建 `wuziqi/index.html` 基础结构：`<!DOCTYPE>`、meta viewport、link style.css、script game.js（defer）、manifest 引用、apple-touch-icon meta
- [x] 1.2 创建 `wuziqi/style.css` 全局样式：CSS reset、`touch-action: none`、`overscroll-behavior: contain`、`user-select: none`、`-webkit-touch-callout: none`、`-webkit-user-select: none`
- [x] 1.3 渲染 9×9 棋盘静态 DOM：CSS Grid 9 列、每格至少 60px、棋盘居中、格子有清晰网格线
- [x] 1.4 渲染顶部回合指示器区域：当前方头像预览位 + 文字位
- [x] 1.5 渲染底部按钮区域：悔棋、重开、家长入口（角落小字灰色）
- [x] 1.6 创建 `wuziqi/manifest.json`：name、short_name、icons、start_url、display: standalone、background_color、theme_color
- [x] 1.7 验证：双击 index.html 在桌面浏览器打开，棋盘和按钮正确显示

## 2. 核心游戏逻辑（game.js）

- [x] 2.1 定义游戏状态数据结构：`board`（9×9 二维数组，存储 null | 'jojo' | 'baba' | 'mama' | 'gege' | 'jiejie' | 'wolf'）、`currentPlayer`（'family' | 'wolf'）、`familyRotationQueue`（角色循环索引）、`moveHistory`（用于悔棋）
- [x] 2.2 实现家人轮换逻辑：`getNextFamilyChar()` 按 `jojo→baba→mama→gege→jiejie` 循环返回下一个角色
- [x] 2.3 实现落子函数 `placeStone(row, col)`：校验空格、写入 board、附加角色 PNG 到对应 DOM 格子、推进轮换、切换回合、写入 moveHistory
- [x] 2.4 实现回合指示器更新：根据 `currentPlayer` 显示家人头像预览 + 文字"轮到 XX"或"轮到狼"
- [x] 2.5 绑定格子点击/触摸事件（统一通过 pointerdown 事件，桌面+触屏兼容）→ 调用 placeStone
- [x] 2.6 实现"棋子不可覆盖"约束：点击已占格不响应、回合不变
- [x] 2.7 实现悔棋 `undoLastMove()`：从 moveHistory 弹出最后一项、回退 board 状态、回退轮换索引、回退回合
- [x] 2.8 实现重开 `resetGame()`：清空 board、重置轮换为 jojo、重置回合为 family、清空所有 DOM 棋子
- [x] 2.9 验证：能在棋盘上交替放下家人和狼棋子、悔棋/重开正常工作

## 3. 五子连线判胜

- [x] 3.1 实现判胜函数 `checkWin(row, col, player)`：4 方向扫描（DIRS = [[0,1],[1,0],[1,1],[1,-1]]）、每方向正反两侧累计同色连续棋子、≥5 返回获胜方与连线 cells 数组
- [x] 3.2 家人方判胜使用"任意家人角色均算同色"规则（jojo/baba/mama/gege/jiejie 视为同色）
- [x] 3.3 狼方判胜：仅 wolf 算同色
- [x] 3.4 落子后立即调用 checkWin，命中则进入"游戏结束"状态：禁用棋盘交互、显示胜利覆盖层（含获胜方头像 + "再来一局"按钮）
- [x] 3.5 实现"游戏结束后点击重开"流程：重置游戏、隐藏胜利覆盖层、恢复棋盘交互
- [x] 3.6 验证：手动构造 4 方向各 5 连场景，全部正确判胜；4 连不判胜

## 4. 平板触控体验（tablet-experience）

- [x] 4.1 实现 palm rejection：通过 `pointerdown` 事件 + `event.pointerId` 跟踪首个活跃指针，忽略其他 pointerid 的 down 事件直到首指针 up
- [x] 4.2 触摸即时反馈：`pointerdown` 时立即给目标格子添加 `.pressed` CSS 类（背景色变化）
- [x] 4.3 验证 `touch-action: none` + `overscroll-behavior: contain` + `user-select: none` + `-webkit-touch-callout: none` 全部生效（上下滑不滚动、双指不缩放、长按不弹系统菜单）
- [x] 4.4 实现横竖屏自适应：用 CSS media query `(orientation: portrait|landscape)` 调整按钮位置和棋盘外边距
- [x] 4.5 监听 `resize` 和 `orientationchange` 事件，确保布局实时响应朝向切换
- [ ] 4.6 在 iOS Safari 实测："添加到主屏幕"后以 standalone 模式启动、无 Safari UI
- [ ] 4.7 验证 Android Chrome "添加到主屏幕" 同样工作

## 5. 连线提示算法（hint.js）

- [x] 5.1 定义 `previewLinesAt(board, row, col, player)`：临时将 `(row, col)` 设为 player、对 4 方向扫描、每方向返回 `{direction, cells, length, openEnds}`、最后撤销临时设置
- [x] 5.2 家人方 player 参数视为"任意家人角色"（与判胜规则一致）
- [x] 5.3 实现 `getHintData(row, col)`：仅当 `currentPlayer === 'family'` 时返回 lines，否则返回 null
- [x] 5.4 过滤返回结果：仅保留 `length >= 2` 的 lines（孤立棋子不算连线）
- [x] 5.5 验证：手动构造已知场景，previewLinesAt 返回的 length、cells 与预期一致

## 6. 连线提示可视化（hint.js + style.css）

- [x] 6.1 在棋盘容器上叠加一个 `<svg class="hint-overlay">`，绝对定位与棋盘对齐、`pointer-events: none`
- [x] 6.2 实现"幽灵棋子"渲染：hover/long-press 触发时在目标格绘制 40% 透明度的当前轮到家人 PNG
- [x] 6.3 实现整颗家人棋子黄色光晕：在连线 cells 对应的 DOM 格子上添加 `.hint-glow` 类，CSS 定义 2Hz 亮度脉冲（@keyframes brightness 振荡）
- [x] 6.4 实现 SVG 曲线连线：根据 cells 坐标计算 SVG `<path>` d 属性、动画 stroke-dasharray 400ms 画入
- [x] 6.5 实现计数点：在 SVG 中沿连线中垂线下方绘制 N 个小圆点（不用文字）
- [x] 6.6 实现 N≥3 时撒花粒子动画：在连线 cells 随机偏移生成彩色小圆点，CSS 动画上升消失
- [x] 6.7 实现 `clearHints()` 函数：清空 SVG 子元素、移除所有 `.hint-glow` 类、清除撒花 DOM
- [x] 6.8 实现桌面端 hover 触发：`pointerenter`/`pointerleave` 绑定到空格、仅在 currentPlayer === 'family' 且 hintLevel !== 'OFF' 时触发 getHintData → 渲染
- [x] 6.9 实现触屏长按 300ms 触发：`pointerdown` 时启动 `setTimeout(renderHints, 300)`，`pointerup` 或 `pointermove`（超 30px 阈值）时取消定时器
- [x] 6.10 实现触屏长按后松手落子 / 拖走取消：长按已触发后 `pointerup` 调用 placeStone、`pointermove` 超 30px 调用 clearHints 并标记取消
- [x] 6.11 实现三档表现：OFF 不渲染、SUBTLE 仅添加 `.hint-glow` 类（不加 SVG/计数点/撒花）、FULL 全部渲染
- [x] 6.12 监听 `resize`/`orientationchange` 事件：若提示激活则按新棋盘尺寸重绘 SVG
- [x] 6.13 验证：手动构造 3 连、4 连场景，FULL 档全部视觉元素正确显示；SUBTLE 档仅光晕；OFF 档无任何提示

## 7. 音效系统（audio.js）

- [x] 7.1 创建 `AudioContext` 懒加载封装 `getAudioContext()`：首次调用时创建、调用 resume()、捕获异常
- [x] 7.2 实现首次 pointerdown 全局监听：触发 getAudioContext() 解锁、解锁后移除监听
- [x] 7.3 实现 `playPlaceSound()`：短促单音（如正弦波 800Hz、attack 5ms、release 120ms）
- [x] 7.4 实现 `playCheerSound(lineLength)`：上行音阶（N=3 播 3 音符、N=4 播 4 音符），频率递增
- [x] 7.5 实现 `playWinSound()`：5 音符胜利旋律，与普通欢呼明显不同（更长、更高音）
- [x] 7.6 在 game.js 的 placeStone 中调用 playPlaceSound()；在 checkWin 命中时调用 playWinSound()；否则若形成 N≥3 连线调用 playCheerSound(N)
- [x] 7.7 实现音效总开关：所有播放函数入口检查 `soundEnabled` 标志，false 时直接 return
- [ ] 7.8 验证：iOS Safari 首次点击后音效正常播放；Android Chrome 同样工作；所有音效有 attack/release 包络无爆音 (- 未能实机测试，代码遵循 Web Audio API 标准用法)

## 8. 家长控制系统

- [x] 8.1 实现"Parents"按钮点击 → 显示 baby gate 弹窗（含"按住 3 秒进入"文案 + 圆形进度按钮）
- [x] 8.2 实现 baby gate 3 秒长按逻辑：`pointerdown` 启动 setInterval 倒计时（"3...2...1..."），3 秒到打开家长面板；`pointerup` 中断并重置
- [x] 8.3 实现家长面板 DOM：提示档位选择器（OFF/SUBTLE/FULL 三选一）、音效开关（toggle）、"完成"按钮
- [x] 8.4 实现设置状态模块 `settings.js`：`loadSettings()` / `saveSettings()` 读写 localStorage（键 `wuziqi:hintLevel`、`wuziqi:soundEnabled`），首次启动默认 FULL/true
- [x] 8.5 实现设置更改即时生效：提示档位变化时更新 `hintLevel` 全局变量、音效开关变化时更新 `soundEnabled`、自动调用 saveSettings()
- [x] 8.6 实现"完成"按钮关闭面板、保持棋局不变
- [x] 8.7 验证：baby gate 短按不进入；按住 3 秒进入；设置更改持久化跨会话；音效开关与提示档位互不影响

## 9. PWA 与最终打磨

- [x] 9.1 创建 PWA 图标：基于已有角色 PNG（如 jojo.png）生成 192×192 和 512×512 的 app 图标（可用 ImageMagick 或简单缩放），放到 `wuziqi/resources/icons/`
- [x] 9.2 验证 manifest.json 引用的图标路径正确、`display: standalone` 生效
- [ ] 9.3 在 iOS Safari 添加到主屏幕，验证图标正确显示、启动无 Safari UI
- [ ] 9.4 在 Android Chrome 添加到主屏幕，验证同上
- [ ] 9.5 跨浏览器测试：Safari (iOS + macOS)、Chrome (Android + 桌面)、Firefox 桌面 — 棋盘、提示、音效、家长面板全部工作
- [x] 9.6 边界用例测试：棋盘满载平局处理（可显示"和棋"覆盖层或仅禁用棋盘）、悔棋到空棋盘、连续悔棋（仅一步）、游戏结束后悔棋（应禁用）
- [x] 9.7 在 `wuziqi/` 目录添加简短 `README.md`：如何运行（双击 index.html）、如何加入主屏幕、如何调整家长设置、技术栈说明
- [x] 9.8 在仓库根目录添加 `.gitignore`（node_modules/、.DS_Store、editor folders）
- [x] 9.9 在 `openspec/config.yaml` 的 `context:` 字段填入项目技术栈（vanilla JS + 多文件结构），为后续游戏建立规范参考

## 10. Wave 4 — 交叉点棋盘 + 圆形棋子 + 可变棋盘尺寸

- [x] 10.1 将棋盘从「格子里放棋」改为「交叉点放棋」（棋子位于网格线交叉处，而非方格内部）
- [x] 10.2 渲染圆形棋子（border-radius: 50%，角色 PNG 居中 object-fit: contain，家人暖黄底色 / 狼冷灰底色区分）
- [x] 10.3 BOARD_SIZE 由常量改为变量（默认 13，可选 9/13/15）
- [x] 10.4 settings.js：暴露 getBoardSize / setBoardSize，持久化到 localStorage，派发 wuziqi:boardSizeChanged 事件
- [x] 10.5 game.js：rebuildBoard() 函数，监听 boardSizeChanged 事件，所有循环/判胜/平局检测改用实时 BOARD_SIZE
- [x] 10.6 hint.js：验证 cellCenter 坐标计算在新的交叉点定位下正确工作
- [x] 10.7 (Wave 5) 在控制区添加可见的设置入口按钮
- [x] 10.8 (Wave 5) 在设置面板中添加棋盘尺寸选择器
- [x] 10.9 (Wave 5) 触摸提示在落子后持续 3 秒（平板体验）
