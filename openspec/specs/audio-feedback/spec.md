## ADDED Requirements

### Requirement: Web Audio API 生成所有音效
系统 SHALL 使用 Web Audio API 实时合成所有音效，不引用任何外部音频文件（mp3/wav/ogg 等）。

#### Scenario: 无外部音频资源
- **WHEN** 检查 `wuziqi/` 目录文件清单
- **THEN** 目录下 SHALL NOT 存在任何音频文件（.mp3、.wav、.ogg、.m4a），所有音效通过 Web Audio API OscillatorNode/GainNode 合成

### Requirement: 落子音效
每次成功落子 SHALL 播放短促清脆的"落子"音效（如木鱼声、水滴声），时长 100-200ms。

#### Scenario: 家人落子播放音效
- **WHEN** 孩子方成功落下家人棋子
- **THEN** 系统 SHALL 播放一次落子音效

#### Scenario: 狼落子播放音效
- **WHEN** 大人方成功落下狼棋子
- **THEN** 系统 SHALL 播放一次落子音效（可与家人相同或略有差异）

### Requirement: 连线欢呼音效
当落子后形成 length ≥ 3 的连线时，系统 SHALL 播放上行音阶式的"欢呼"音效，连线越长音调越高或音符越多。

#### Scenario: 形成 3 连线播放欢呼
- **WHEN** 玩家落子后形成 length=3 的连线
- **THEN** 系统 SHALL 播放欢呼音效（如 3 音符上行音阶）

#### Scenario: 形成 5 连线播放胜利乐句
- **WHEN** 玩家落子后形成 length=5 的连线（获胜）
- **THEN** 系统 SHALL 播放完整胜利乐句（如 5 音符旋律），且与普通欢呼有显著区别

#### Scenario: 2 连线不播放欢呼
- **WHEN** 玩家落子后最长连线仅为 length=2
- **THEN** 系统 SHALL 仅播放落子音效，不播放欢呼

### Requirement: 首次用户交互解锁 AudioContext
系统 SHALL 在首次用户交互（点击/触摸）时创建并解锁 AudioContext，以遵守移动浏览器"用户手势激活音频"的策略。

#### Scenario: 首次点击解锁音频
- **WHEN** 玩家首次点击/触摸棋盘
- **THEN** 系统 SHALL 创建 AudioContext（如尚未创建）并调用 `resume()` 解锁，后续音效可正常播放

#### Scenario: 解锁前不报错
- **WHEN** 页面加载完成但玩家尚未交互
- **THEN** 系统 SHALL NOT 尝试播放音效，且 SHALL NOT 在控制台抛出 AudioContext 相关错误

### Requirement: 音效开关可独立控制
系统 SHALL 在家长控制面板提供独立的音效开关，与提示档位分开控制；关闭音效后所有音效均不播放。

#### Scenario: 关闭音效后落子无声
- **WHEN** 家长在设置中关闭音效，玩家落子
- **THEN** 系统 SHALL NOT 播放任何音效（落子、欢呼、胜利均静音）

#### Scenario: 音效开关不影响提示视觉
- **WHEN** 家长关闭音效但提示档位为 FULL
- **THEN** 提示视觉元素（光晕、连线、计数点、撒花）SHALL 照常显示，仅音效被静音

### Requirement: 音量不刺耳
所有生成音效的音量 SHALL 经过合适的包络处理（attack/release），避免爆音或刺耳的方波直入。

#### Scenario: 音效有渐入渐出
- **WHEN** 任意音效播放
- **THEN** 波形 SHALL 经过 GainNode 包络处理（如 attack 10ms、release 100ms），不出现突变爆音
