## ADDED Requirements

### Requirement: 进度数据持久化到 localStorage

系统 SHALL 将所有学习进度数据（已学字、星数、错字本、贴纸、打卡、统计）序列化为 JSON 字符串，存储在 `localStorage` 的 `shizi:progress` 键下。

#### Scenario: 进度单 key 存储

- **WHEN** 检查 `localStorage` 的键
- **THEN** 系统 SHALL 仅使用一个名为 `shizi:progress` 的键存储完整进度 JSON，SHALL NOT 使用 `shizi:word:w001`、`shizi:word:w002` 等分字 key

#### Scenario: 进度数据结构

- **WHEN** 读取 `shizi:progress` 的值并 JSON.parse
- **THEN** 结果 SHALL 包含字段：`version`（数字）、`unlockedLevel`（数字 1-10）、`words`（对象，key 为字 id，value 含 `stars/listenCorrect/parentConfirmed/inErrorBook/lastSeen`）、`errorBook`（字符串数组）、`stickers`（对象）、`streak`（对象）、`stats`（对象）

#### Scenario: 进度 schema 版本字段

- **WHEN** 首次写入进度数据
- **THEN** JSON SHALL 包含 `version: 1` 字段，用于未来 schema 变更时的数据迁移识别

### Requirement: 即时写入进度

系统 SHALL 在每次答对/家长确认/通关/进错字本等进度变化时立即写入 `localStorage`，SHALL NOT 批量延迟写入。

#### Scenario: 答对后立即持久化

- **WHEN** 玩家在听音选字模式答对一字
- **THEN** 系统 SHALL 在更新内存中进度对象后立即调用 `localStorage.setItem('shizi:progress', JSON.stringify(progress))`，确保玩家随时退出不丢进度

#### Scenario: localStorage 写入失败降级

- **WHEN** `localStorage.setItem` 抛出异常（如配额超限、隐私模式禁用）
- **THEN** 系统 SHALL 在 try/catch 中捕获异常， SHALL 在控制台输出警告， SHALL NOT 阻塞游戏继续进行（降级为内存中的进度，本次会话内有效）

### Requirement: 3 星评级机制

每个字 SHALL 最多累计 3 颗星，分别对应不同的学习行为：

- ⭐（初步认识）：亲子认字模式家长点「✅ 会了」一次
- ⭐⭐（听音能辨）：听音选字模式答对该字 1 次
- ⭐⭐⭐（牢固掌握）：听音选字模式累计答对该字 3 次（不同场次）

#### Scenario: 家长确认给第一颗星

- **WHEN** 家长在亲子认字模式对字 `w001` 点击「会了」，且该字当前 `parentConfirmed === false`
- **THEN** 系统 SHALL 将 `words.w001.parentConfirmed` 设为 `true`，`words.w001.stars` SHALL 至少为 1

#### Scenario: 听音答对一次给第二颗星

- **WHEN** 玩家在听音选字模式首次答对字 `w001`（`listenCorrect` 从 0 变为 1）
- **THEN** 系统 SHALL 将 `words.w001.listenCorrect` 设为 1，`words.w001.stars` SHALL 至少为 2（若已 ≥2 则不变）

#### Scenario: 听音累计答对三次给第三颗星

- **WHEN** 玩家在听音选字模式累计答对字 `w001` 达到 3 次（`listenCorrect` 从 2 变为 3）
- **THEN** 系统 SHALL 将 `words.w001.listenCorrect` 设为 3，`words.w001.stars` SHALL 设为 3（满星）

#### Scenario: 星数单调不减

- **WHEN** 任何进度更新发生
- **THEN** `words[wordId].stars` 字段 SHALL 单调不减（不会因为重练或答错而减少）

### Requirement: 关卡解锁规则 — 60% 字达 2 星

系统 SHALL 在某关卡内 60% 及以上的字达到 ⭐⭐ 及以上时，自动解锁下一关卡。

#### Scenario: 默认第 1 关解锁

- **WHEN** 玩家首次进入游戏（`shizi:progress` 不存在或为初始状态）
- **THEN** `unlockedLevel` SHALL 为 1，第 1 关的所有字 SHALL 可玩

#### Scenario: 达 60% 门槛解锁下一关

- **WHEN** 第 N 关（N < 10）内有 ≥ 6 个字（60% of 10）的 `stars >= 2`
- **THEN** 系统 SHALL 将 `unlockedLevel` 更新为 `N + 1`（若原本 ≤ N），并播放解锁动画/音效

#### Scenario: 未解锁关卡不可玩

- **WHEN** 玩家尝试访问 `level > unlockedLevel` 的关卡
- **THEN** 系统 SHALL 拒绝加载该关字的题目，SHALL 显示「🔒 完成第 N 关解锁」提示

### Requirement: 错字本自动收录与优先复习

系统 SHALL 在听音选字模式答错时自动将目标字加入 `errorBook` 数组，且在后续出题时优先从错字本抽取。

#### Scenario: 答错加入错字本

- **WHEN** 玩家在听音选字模式选错（且最终选对答案后题目完成）
- **THEN** 系统 SHALL 将该字 id 加入 `errorBook` 数组（若未存在），并设置 `words[wordId].inErrorBook = true`

#### Scenario: 错字优先抽取

- **WHEN** 听音选字模式生成新题目标字
- **THEN** 若 `errorBook` 非空，目标字 SHALL 有 50% 概率从 `errorBook` 中随机抽取，50% 概率从当前关卡未满星字中抽取

#### Scenario: 错字满星后移出错字本

- **WHEN** 错字本中的某字 `stars` 达到 3（满星）
- **THEN** 系统 SHALL 将该字从 `errorBook` 数组中移除，设置 `words[wordId].inErrorBook = false`

### Requirement: 打卡贴纸墙机制

系统 SHALL 提供「打卡贴纸墙」正反馈机制：连续 7 天玩 = 1 枚贴纸；每通关 1 关 = 1 枚贴纸。

#### Scenario: 连续 7 天打卡得贴纸

- **WHEN** 玩家连续第 7 个自然日打开游戏（`streak.current % 7 === 0` 且 `streak.current > 0`）
- **THEN** 系统 SHALL 将 `stickers.days7` 加 1，播放贴纸获得动画，弹出「🎉 连续学习 7 天！获得贴纸 ×1」庆祝

#### Scenario: 通关一关得贴纸

- **WHEN** 玩家首次通关某关（该关所有字满星或达解锁条件）
- **THEN** 系统 SHALL 将该关卡 id 加入 `stickers.levelClear` 数组，弹出通关庆典（全屏撒花 + JoJo 跳舞 + 庆祝音效，持续约 3 秒）

#### Scenario: 连续打卡中断重置

- **WHEN** 玩家上次游玩日期与当前日期间隔 > 1 天（即中断了连续打卡）
- **THEN** 系统 SHALL 将 `streak.current` 重置为 1（从今天重新开始计数）， SHALL NOT 影响 `stickers.days7` 已获得的贴纸

### Requirement: 进度重置功能

系统 SHALL 在家长设置面板（baby-gate 保护下）提供「重置进度」按钮，清空所有学习数据。

#### Scenario: 家长重置进度

- **WHEN** 家长在设置面板点击「重置进度」并二次确认
- **THEN** 系统 SHALL 调用 `localStorage.removeItem('shizi:progress')`，将内存中进度对象重置为初始状态（`unlockedLevel: 1`, `words: {}`, `errorBook: []` 等）， SHALL NOT 影响 `shizi:soundEnabled` 等设置类 key
