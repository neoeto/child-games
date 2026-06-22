## ADDED Requirements

### Requirement: 双模式入口主界面

游戏 `shizi/index.html` SHALL 在主界面提供两个并列的模式入口卡片：「🎧 听音选字」和「👨‍👩‍👧 亲子认字」，以及一个「📊 我的字库」进度入口。

#### Scenario: 主界面三入口布局

- **WHEN** 玩家进入 `shizi/index.html`
- **THEN** 系统 SHALL 显示三个入口：听音选字模式、亲子认字模式、我的字库（进度查看），每个入口配 emoji 图标 + 模式名 + 简短描述

#### Scenario: 进度入口显示当前进度摘要

- **WHEN** 主界面渲染
- **THEN** 「我的字库」入口或顶部进度条 SHALL 显示「已学 N/100 字 · 第 X 关 · ⭐ 总数」

### Requirement: 听音选字模式 — 发音播放后展示选项

听音选字模式 SHALL 在进入每一题时，首先自动播放一次目标字的发音（通过 speechSynthesis），然后展示 4 个汉字选项卡。

#### Scenario: 进入题目自动播放发音

- **WHEN** 玩家进入听音选字模式的新一题
- **THEN** 系统 SHALL 自动调用 `speechSynthesis.speak()` 播放目标字的中文发音，同时显示「正在播放...」视觉提示（如喇叭动画）

#### Scenario: 发音播放完毕后显示选项

- **WHEN** 目标字发音播放完毕（或立即并发，取决于实现）
- **THEN** 系统 SHALL 显示 4 个汉字大字卡选项（A/B/C/D），每个选项字号 SHALL 不小于 60px

### Requirement: 听音选字模式 — 「再听一次」按钮常驻

听音选字模式 SHALL 在整个答题过程中常驻显示「🔁 再听一次」按钮，允许孩子随时重听目标字发音。

#### Scenario: 任意时刻可重听

- **WHEN** 玩家在答题过程中点击「再听一次」按钮
- **THEN** 系统 SHALL 重新调用 `speechSynthesis.speak()` 播放目标字发音，按钮无次数限制

### Requirement: 听音选字模式 — 答错不惩罚且错误项变灰

听音选字模式中，玩家选错时 SHALL 不退出题目、不扣分，仅将错误选项变灰禁用，允许继续选择剩余选项。

#### Scenario: 选错后错误项变灰

- **WHEN** 玩家点击错误选项
- **THEN** 系统 SHALL 将该错误选项视觉变灰并禁用点击，显示鼓励文案（如「再试试~」），且 SHALL NOT 结束当前题

#### Scenario: 选对后题目完成

- **WHEN** 玩家点击正确选项
- **THEN** 系统 SHALL 播放庆祝动画（如撒花/JoJo 跳跃）+ 庆祝音效，调用进度系统记录答对（调用 progress 模块的 `recordListenCorrect(wordId)`），2 秒后进入下一题

### Requirement: 听音选字模式 — 干扰项从同关卡随机抽取

听音选字的 4 个选项中，正确字 + 3 个干扰字 SHALL 从同一关卡的字库中随机抽取。

#### Scenario: 干扰项同关随机

- **WHEN** 系统生成一道新题
- **THEN** 3 个干扰字 SHALL 从与目标字相同 `level` 的字库中随机不重复抽取，且 SHALL NOT 等于目标字

#### Scenario: 错字本字优先抽取

- **WHEN** 玩家的错字本（`errorBook`）非空
- **THEN** 目标字 SHALL 有 50% 概率从错字本中抽取（优先复习），50% 概率从当前关卡未掌握字中抽取

### Requirement: 亲子认字模式 — 巨大字卡显示

亲子认字模式 SHALL 显示一个占据屏幕主要区域的巨大字卡（汉字字号不小于 200px），让孩子和家长都能清晰看到。

#### Scenario: 字卡渲染

- **WHEN** 玩家进入亲子认字模式并加载一个字
- **THEN** 系统 SHALL 在屏幕中央渲染字号 ≥ 200px 的汉字，字卡 SHALL 占据屏幕宽度的 60% 以上

### Requirement: 亲子认字模式 — 点字听发音

亲子认字模式 SHALL 允许点击字卡任意位置触发标准发音播放，供家长比对孩子的读音。

#### Scenario: 点击字卡播放发音

- **WHEN** 家长或孩子点击字卡
- **THEN** 系统 SHALL 调用 `speechSynthesis.speak()` 播放该字的标准中文发音

### Requirement: 亲子认字模式 — 家长判定双按钮

亲子认字模式 SHALL 提供「✅ 会了」和「🌱 再练」两个判定按钮，由家长主观判定后点击记录。

#### Scenario: 家长点「会了」

- **WHEN** 家长点击「✅ 会了」按钮
- **THEN** 系统 SHALL 调用进度模块的 `recordParentConfirmed(wordId)` 记录该字获得 ⭐（初步认识星），播放轻奖励音效，加载下一个字

#### Scenario: 家长点「再练」

- **WHEN** 家长点击「🌱 再练」按钮
- **THEN** 系统 SHALL 将该字加入错字本（调用 `addToErrorBook(wordId)`），加载下一个字（不强制重练当前字）

### Requirement: 亲子认字模式 — 字的小知识展示

亲子认字模式 SHALL 在字卡下方显示当前字的「💡 小知识」提示文案（来自字库数据的 `tip` 字段），辅助家长讲解。

#### Scenario: 显示 tip 文案

- **WHEN** 亲子认字模式加载一个字
- **THEN** 系统 SHALL 在字卡下方显示该字 `tip` 字段对应的文案（如「一根手指就是一」），字号不小于 18px

### Requirement: 模式切换不丢失进度

玩家在两个模式间切换时 SHALL 不丢失任何已记录的进度（星星、错字本、关卡解锁状态）。

#### Scenario: 模式间切换后进度保留

- **WHEN** 玩家在听音选字模式答对一字获得星星后，切换到亲子认字模式
- **THEN** 该字的星星记录 SHALL 在亲子认字模式中同样可见（如字卡旁显示当前星数）
