## ADDED Requirements

### Requirement: 9×9 棋盘初始化
游戏 SHALL 在启动时渲染一个 9×9 的方格棋盘，每个格子均可点击/触摸放置棋子。

#### Scenario: 游戏首次启动
- **WHEN** 玩家打开 `wuziqi/index.html`
- **THEN** 显示一个 9×9 的空棋盘，所有格子均为空且可交互

#### Scenario: 棋盘大小固定
- **WHEN** 棋盘渲染完成
- **THEN** 棋盘 SHALL 是 9 行 × 9 列共 81 个格子，不多不少

### Requirement: 家人方角色轮换落子
孩子方（家人）的每个回合 SHALL 按 `jojo → baba → mama → gege → jiejie → jojo → ...` 的固定顺序循环出角色，孩子不能选择当前轮到哪个家人。

#### Scenario: 第 1 回合落子
- **WHEN** 孩子方首次落子
- **THEN** 该棋子 SHALL 显示 `jojo.png` 图像

#### Scenario: 第 5 回合落子
- **WHEN** 孩子方第 5 次落子（已是家人的第 5 个回合）
- **THEN** 该棋子 SHALL 显示 `jiejie.png` 图像

#### Scenario: 第 6 回合落子（循环）
- **WHEN** 孩子方第 6 次落子（循环重启）
- **THEN** 该棋子 SHALL 再次显示 `jojo.png` 图像

### Requirement: 狼方每步使用同一形象
大人方（狼）的每个回合 SHALL 始终使用 `wolf.png` 作为棋子图像，不轮换。

#### Scenario: 狼方任意回合落子
- **WHEN** 大人方在任意回合落子
- **THEN** 该棋子 SHALL 显示 `wolf.png` 图像

### Requirement: 回合交替
游戏 SHALL 严格交替双方回合：孩子方先手，然后大人方，然后孩子方……直到游戏结束。

#### Scenario: 开局第一手
- **WHEN** 游戏开始
- **THEN** 第 1 手 SHALL 是孩子方（jojo）

#### Scenario: 回合切换
- **WHEN** 孩子方刚落下一颗家人棋子
- **THEN** 下一步 SHALL 切换到大人方（狼）回合

### Requirement: 五子连线判胜
当任一方在水平、垂直或两条对角线（共 4 个方向）上形成至少 5 颗连续己方棋子时，游戏 SHALL 判定该方获胜并立即结束。

#### Scenario: 家人五连水平获胜
- **WHEN** 棋盘上同一行存在连续 5 颗家人棋子（不论是否同一角色）
- **THEN** 系统 SHALL 判定孩子方获胜，结束游戏

#### Scenario: 家人五连垂直获胜
- **WHEN** 棋盘上同一列存在连续 5 颗家人棋子
- **THEN** 系统 SHALL 判定孩子方获胜，结束游戏

#### Scenario: 家人五连对角线获胜
- **WHEN** 棋盘上主对角线（↘）或反对角线（↙）存在连续 5 颗家人棋子
- **THEN** 系统 SHALL 判定孩子方获胜，结束游戏

#### Scenario: 狼五连任意方向获胜
- **WHEN** 棋盘上任一方向存在连续 5 颗狼棋子
- **THEN** 系统 SHALL 判定大人方获胜，结束游戏

#### Scenario: 家人棋子无角色区分
- **WHEN** 一条连线由 `jojo + baba + mama + gege + jiejie` 5 个不同角色组成
- **THEN** 系统 SHALL 判定孩子方获胜（不要求同一角色）

### Requirement: 落子后立即判胜
判胜逻辑 SHALL 在每次落子后立即执行，不等待下一次回合。

#### Scenario: 第 5 颗家人落子立即判胜
- **WHEN** 孩子方落下第 5 颗家人棋子并形成 5 连
- **THEN** 系统 SHALL 立即判定获胜，不允许大人方继续落子

### Requirement: 棋子不可移动或覆盖
一旦棋子放置在空格上，SHALL 不可移动；已放置棋子的格子 SHALL 不接受新的落子。

#### Scenario: 尝试在已占格子落子
- **WHEN** 玩家点击一个已有棋子的格子
- **THEN** 系统 SHALL 拒绝落子，回合不变，不消耗当前轮到的角色

### Requirement: 悔棋功能
游戏 SHALL 提供悔棋按钮，点击后撤销最近一步落子（仅一步，不连续悔棋）。

#### Scenario: 悔棋一步
- **WHEN** 玩家在游戏进行中点击"悔棋"按钮
- **THEN** 系统 SHALL 撤销最近一步落子，恢复该格为空，回合并角色顺序回退一步

#### Scenario: 棋盘为空时悔棋无效
- **WHEN** 棋盘无任何棋子时玩家点击"悔棋"
- **THEN** 系统 SHALL 不做任何操作

### Requirement: 重开游戏
游戏 SHALL 提供"重开"按钮，点击后清空棋盘所有棋子，回合重置为孩子方先手，家人轮换重置为 `jojo` 开头。

#### Scenario: 重开清空棋盘
- **WHEN** 玩家点击"重开"按钮
- **THEN** 所有棋子 SHALL 被清除，回合回到孩子方第 1 手（jojo）

#### Scenario: 游戏结束后重开
- **WHEN** 游戏已分出胜负后玩家点击"重开"
- **THEN** 系统 SHALL 清空棋盘并允许重新开始一局

### Requirement: 回合指示器
游戏 SHALL 在顶部显示当前回合是孩子方还是大人方，且孩子方时显示即将落子的家人头像预览。

#### Scenario: 显示当前回合
- **WHEN** 当前是孩子方回合且即将落 `baba`
- **THEN** 顶部 SHALL 显示孩子方标识 + `baba.png` 头像预览 + 文字"轮到爸爸"

#### Scenario: 显示狼方回合
- **WHEN** 当前是大人方回合
- **THEN** 顶部 SHALL 显示大人方标识 + `wolf.png` 头像 + 文字"轮到狼"
