## ADDED Requirements

### Requirement: 提示仅对孩子方可用
连线提示 SHALL 仅在孩子方（家人）回合触发；大人方（狼）回合期间 SHALL 不显示任何提示。

#### Scenario: 孩子方回合触发提示
- **WHEN** 孩子方回合中且提示功能开启
- **THEN** 系统 SHALL 在符合触发条件时显示连线提示

#### Scenario: 大人方回合不触发提示
- **WHEN** 大人方（狼）回合中
- **THEN** 系统 SHALL 不显示任何连线提示，即使提示功能开启

### Requirement: 桌面端 hover 触发提示
在桌面浏览器上，当孩子方玩家将鼠标悬停在一个空格上超过触发延时时，系统 SHALL 显示该格的连线预览。

#### Scenario: 桌面 hover 空格
- **WHEN** 孩子方回合中且鼠标悬停在一个空格上
- **THEN** 系统 SHALL 在该格显示幽灵棋子，并展示该格放置后会形成的所有家人连线（length ≥ 2）

#### Scenario: 鼠标移出取消提示
- **WHEN** 鼠标移出当前悬停的格子且未点击
- **THEN** 系统 SHALL 立即清除所有提示视觉元素

### Requirement: 平板长按 300ms 触发提示
在触屏设备上，当孩子方玩家在一个空格上按住超过 300ms 时，系统 SHALL 显示该格的连线预览；松手 SHALL 落子，拖走 SHALL 取消。

#### Scenario: 触屏长按空格触发提示
- **WHEN** 孩子方回合中且玩家在空格上按住超过 300ms
- **THEN** 系统 SHALL 在该格显示幽灵棋子和连线预览，但不立即落子

#### Scenario: 触屏长按后松手落子
- **WHEN** 提示已显示且玩家松开手指
- **THEN** 系统 SHALL 在该格落子（执行正常落子流程）

#### Scenario: 触屏长按后拖走取消
- **WHEN** 提示已显示且玩家将手指拖离该格超过阈值（如 30px）后松开
- **THEN** 系统 SHALL 取消落子，清除提示，回合不变

### Requirement: 连线检测算法准确性
连线提示 SHALL 准确检测从预览格出发的 4 个方向（水平、垂直、主对角线 ↘、反对角线 ↙）上所有与家人方连通的连续棋子（含预览格本身）。

#### Scenario: 检测水平连线
- **WHEN** 预览格同一行有 2 颗家人棋子相邻
- **THEN** 提示 SHALL 显示一条 length=3 的水平连线（含预览格）

#### Scenario: 检测对角线连线
- **WHEN** 预览格反对角线方向有 1 颗家人棋子相邻
- **THEN** 提示 SHALL 显示一条 length=2 的反对角线连线

#### Scenario: 跨越空格不连通
- **WHEN** 预览格某方向上有家人棋子但中间隔了空格或狼棋子
- **THEN** 提示 SHALL NOT 将这些远处棋子计入同一条连线

### Requirement: 三档提示强度
系统 SHALL 支持三档提示强度，由家长在家长控制面板中切换：`OFF`、`SUBTLE`、`FULL`。

#### Scenario: OFF 档无提示
- **WHEN** 提示档位为 `OFF`
- **THEN** 系统 SHALL NOT 显示任何连线提示视觉元素，即使触发条件满足

#### Scenario: SUBTLE 档仅光晕
- **WHEN** 提示档位为 `SUBTLE` 且触发条件满足
- **THEN** 系统 SHALL 仅对参与连线的家人棋子显示静态黄色光晕，不绘制 SVG 连线、不显示计数点、不撒花

#### Scenario: FULL 档完整提示
- **WHEN** 提示档位为 `FULL` 且触发条件满足
- **THEN** 系统 SHALL 显示：整颗家人棋子黄色光晕（2Hz 亮度脉冲）+ SVG 曲线连接所有连线棋子 + 连线下方计数点 + N≥3 时撒花粒子

### Requirement: 默认提示档位为 FULL
首次打开游戏时，提示档位 SHALL 默认为 `FULL`，以帮助 4 岁孩子建立"连线"概念。

#### Scenario: 首次启动默认档位
- **WHEN** 玩家首次打开游戏（无 localStorage 设置记录）
- **THEN** 提示档位 SHALL 为 `FULL`

### Requirement: 提示视觉表现规范
FULL 档提示 SHALL 遵循以下视觉规范：光晕颜色为单一黄色（不彩虹换色）、脉冲频率约 2Hz（500ms 亮 / 500ms 暗）、SVG 连线为曲线（动画 400ms 画入）、计数点为圆点排列在连线下方（不用阿拉伯数字）。

#### Scenario: 光晕频率与颜色
- **WHEN** FULL 档提示激活
- **THEN** 家人棋子的光晕 SHALL 为单一黄色，亮度以约 2Hz 频率脉冲（不涉及颜色切换）

#### Scenario: 计数用点不用数字
- **WHEN** 一条连线 length=3 且 FULL 档提示激活
- **THEN** 连线下方 SHALL 显示 3 个圆点（不显示"3"或"three"文字）

#### Scenario: N≥3 触发撒花
- **WHEN** 一条连线 length=3 或更多且 FULL 档提示激活
- **THEN** 系统 SHALL 在连线沿线释放撒花粒子动画

#### Scenario: N<3 不撒花
- **WHEN** 一条连线 length=2 且 FULL 档提示激活
- **THEN** 系统 SHALL NOT 显示撒花粒子
