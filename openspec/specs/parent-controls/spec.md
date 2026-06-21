## ADDED Requirements

### Requirement: 角落不显眼的家长入口按钮
游戏 SHALL 在屏幕角落放置一个"Parents"（家长）入口按钮，按钮 SHALL 使用小字号、灰色低调样式，且配有文字标签（孩子不识字会忽略）。

#### Scenario: 家长按钮位置
- **WHEN** 游戏界面渲染
- **THEN** 屏幕 SHALL 有一个"Parents"按钮位于角落（如右上角），尺寸明显小于棋盘格子

#### Scenario: 按钮样式低调
- **WHEN** 渲染家长按钮
- **THEN** 按钮 SHALL 使用小字号、低饱和度颜色，不带闪烁/动画等吸引孩子的视觉元素

### Requirement: Baby gate 3 秒长按保护
进入家长控制面板前 SHALL 强制通过 baby gate：玩家必须按住指定按钮 3 秒（带倒计时反馈"3...2...1..."）才能进入设置。

#### Scenario: 点击家长按钮显示 baby gate
- **WHEN** 玩家点击"Parents"按钮
- **THEN** 系统 SHALL 弹出 baby gate 弹窗，显示"按住 3 秒进入"提示和倒计时机制

#### Scenario: 按住 3 秒成功进入
- **WHEN** 玩家持续按住 baby gate 按钮达到 3 秒
- **THEN** 系统 SHALL 进入家长控制面板，显示当前所有可调设置

#### Scenario: 提前松手重置倒计时
- **WHEN** 玩家按住 baby gate 按钮中途（如 2 秒）松手
- **THEN** 系统 SHALL 重置倒计时，不进入家长面板；再次按住需重新累计 3 秒

#### Scenario: 短按不进入
- **WHEN** 玩家短按 baby gate 按钮（< 1 秒）
- **THEN** 系统 SHALL 关闭 baby gate 弹窗，不进入家长面板

### Requirement: 提示档位家长可调
家长控制面板 SHALL 允许在 `OFF` / `SUBTLE` / `FULL` 三档之间切换连线提示强度，且更改即时生效（无需重启游戏）。

#### Scenario: 切换提示档位
- **WHEN** 家长在面板中将提示档位从 `FULL` 切换为 `SUBTLE`
- **THEN** 系统 SHALL 立即更新设置，下一次触发提示时按 `SUBTLE` 档表现

#### Scenario: 档位持久化
- **WHEN** 家长更改档位后关闭浏览器并重新打开游戏
- **THEN** 提示档位 SHALL 保持上次设置的值（通过 localStorage 持久化）

### Requirement: 音效开关家长可调
家长控制面板 SHALL 提供独立的音效开关，关闭后所有音效静音但视觉提示不受影响。

#### Scenario: 切换音效开关
- **WHEN** 家长在面板中关闭音效开关
- **THEN** 系统 SHALL 立即静音所有后续音效

#### Scenario: 音效开关持久化
- **WHEN** 家长更改音效开关后关闭浏览器并重新打开
- **THEN** 音效开关 SHALL 保持上次设置的值（通过 localStorage 持久化）

### Requirement: 设置通过 localStorage 持久化
所有家长设置（提示档位、音效开关）SHALL 通过浏览器 `localStorage` 持久化存储，键名 SHALL 有明确命名空间避免与其他游戏冲突。

#### Scenario: 设置保存到 localStorage
- **WHEN** 家长更改任意设置项
- **THEN** 系统 SHALL 立即将新值写入 `localStorage`（如键 `wuziqi:hintLevel`、`wuziqi:soundEnabled`）

#### Scenario: 启动时读取设置
- **WHEN** 游戏首次加载
- **THEN** 系统 SHALL 从 `localStorage` 读取已保存的设置；若无记录则使用默认值（hintLevel=FULL, soundEnabled=true）

#### Scenario: 跨会话保留
- **WHEN** 玩家关闭浏览器后再次打开游戏
- **THEN** 上次保存的所有设置 SHALL 完整恢复

### Requirement: 关闭家长面板返回游戏
家长面板 SHALL 提供"返回游戏"或"完成"按钮，点击后关闭面板并返回棋盘，不重置棋局。

#### Scenario: 完成后返回
- **WHEN** 家长在面板中点击"完成"按钮
- **THEN** 系统 SHALL 关闭面板，回到棋盘界面；棋盘上已有的棋子和当前回合 SHALL 保持不变

#### Scenario: 无保存按钮即时生效
- **WHEN** 家长在面板中修改任意设置
- **THEN** 更改 SHALL 即时生效且自动保存到 localStorage，无需点击"保存"按钮
