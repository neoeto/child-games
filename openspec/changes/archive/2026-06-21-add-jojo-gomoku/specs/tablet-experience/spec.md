## ADDED Requirements

### Requirement: 60px 最小触摸目标
棋盘每个格子 SHALL 在平板上呈现至少 60×60 CSS 像素的触摸区域，以适应 4 岁孩子尚未发育完全的运动控制能力。

#### Scenario: iPad 上格子尺寸
- **WHEN** 游戏在 iPad（768px+ 宽度）上加载
- **THEN** 每个棋盘格子 SHALL 占据至少 60×60 CSS 像素

#### Scenario: 触摸区域中心可点击
- **WHEN** 玩家点击格子的任意位置（包括边缘）
- **THEN** 系统 SHALL 注册该次落子意图为该格子，不误触邻格

### Requirement: 多指 palm rejection
游戏 SHALL 只识别第一个触摸点（first finger），忽略同时或后续的其他触摸点，以应对孩子可能将整只手按在屏幕上的场景。

#### Scenario: 单指触摸正常响应
- **WHEN** 玩家用一根手指触摸一个格子
- **THEN** 系统 SHALL 注册该触摸为有效输入

#### Scenario: 多指同时触摸仅响应第一指
- **WHEN** 玩家同时用多根手指触摸屏幕（如整只手按下）
- **THEN** 系统 SHALL 仅响应第一个被检测到的触摸点，忽略其他手指

#### Scenario: 第一指离开前不接受新指
- **WHEN** 第一指仍在屏幕上时另一指触摸
- **THEN** 系统 SHALL 忽略第二指的输入

### Requirement: 禁用页面滚动与缩放
游戏进行中，玩家在棋盘上的触摸操作 SHALL NOT 触发页面滚动、双指缩放、下拉刷新等浏览器默认行为。

#### Scenario: 触摸不滚动页面
- **WHEN** 玩家在棋盘上上下滑动手指
- **THEN** 页面 SHALL NOT 滚动

#### Scenario: 双指不缩放页面
- **WHEN** 玩家在棋盘上双指捏合或张开
- **THEN** 页面 SHALL NOT 缩放

#### Scenario: 顶部底部不触发下拉刷新
- **WHEN** 玩家在页面顶部向下拉动
- **THEN** 浏览器 SHALL NOT 触发下拉刷新（overscroll-behavior: contain）

### Requirement: 禁用文本选择与长按系统菜单
游戏 SHALL 禁用棋盘区域的文本选择、图像拖拽和 iOS 长按系统菜单（callout），避免干扰长按触发提示功能。

#### Scenario: 长按不弹系统菜单
- **WHEN** 玩家长按一个格子 300ms 以上
- **THEN** 系统 SHALL NOT 弹出 iOS 的"拷贝/分享"系统菜单，仅触发游戏内的连线提示

#### Scenario: 棋子图像不可拖拽
- **WHEN** 玩家尝试拖拽棋盘上的角色 PNG 图像
- **THEN** 浏览器 SHALL NOT 启动图像拖拽预览

### Requirement: 横竖屏自适应
游戏 SHALL 同时支持横屏和竖屏，关键 UI 元素（棋盘、回合指示器、悔棋/重开按钮、家长入口）在两种朝向下均可用且不重叠。

#### Scenario: 竖屏布局
- **WHEN** 设备处于竖屏（如 iPad Portrait）
- **THEN** 棋盘 SHALL 居中显示，回合指示器在棋盘上方，悔棋/重开按钮在棋盘下方

#### Scenario: 横屏布局
- **WHEN** 设备处于横屏（如 iPad Landscape）
- **THEN** 棋盘 SHALL 居中显示，按钮位置 SHALL 自适应调整不溢出屏幕

#### Scenario: 旋转设备实时响应
- **WHEN** 玩家在游戏中旋转设备
- **THEN** 布局 SHALL 立即（无刷新）适应新的朝向

### Requirement: PWA 可加入主屏幕
游戏 SHALL 通过 `manifest.json` 和相关 meta 标签支持"加入主屏幕"功能，安装后以 `display: standalone` 全屏模式启动，无浏览器地址栏。

#### Scenario: manifest 存在且有效
- **WHEN** 浏览器加载 `index.html`
- **THEN** 页面 SHALL 引用 `manifest.json`，且 manifest 中包含 `name`、`icons`、`display: standalone`、`start_url` 字段

#### Scenario: 加入主屏幕后全屏启动
- **WHEN** 玩家从主屏幕图标启动游戏
- **THEN** 游戏 SHALL 以 standalone 模式运行，不显示浏览器地址栏或标签栏

#### Scenario: iOS Safari 添加到主屏
- **WHEN** iOS Safari 用户使用"添加到主屏幕"功能
- **THEN** 启动图标 SHALL 使用 `apple-touch-icon` meta 指定的图像，启动时无 Safari UI

### Requirement: 触摸即时视觉反馈
玩家触摸棋盘格子的瞬间 SHALL 立即看到视觉反馈（如格子背景色变化），无需等待 300ms 延时或长按触发。

#### Scenario: 触摸即时高亮
- **WHEN** 玩家手指按下格子（touchstart）
- **THEN** 该格子 SHALL 立即显示按下态视觉反馈（如背景色变化），不延迟
