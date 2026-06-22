## ADDED Requirements

### Requirement: speechSynthesis 用于汉字发音

`shizi/` 游戏 SHALL 使用浏览器原生 `window.speechSynthesis.speak(new SpeechSynthesisUtterance(char))` 朗读汉字发音，与既有的 Web Audio API 音效共存（音效用 Web Audio，字音用 speechSynthesis）。

#### Scenario: 汉字发音用 speechSynthesis

- **WHEN** 系统需要播放某字的发音（听音选字模式出题、亲子认字模式点字、笔顺播放完毕衔接等场景）
- **THEN** 系统 SHALL 调用 `speechSynthesis.speak(new SpeechSynthesisUtterance(char))`，SHALL 设置 `utterance.lang = 'zh-CN'`，SHALL NOT 使用 Web Audio API 合成语音

#### Scenario: 音效与字音互不干扰

- **WHEN** 同时需要播放字音（如朗读「天」）和音效（如答对庆祝音）
- **THEN** 字音 SHALL 通过 `speechSynthesis` 播放，音效 SHALL 通过 Web Audio API 播放，两者 SHALL 独立触发、互不阻塞

### Requirement: 中文语音可用性检测与降级

系统 SHALL 在启动时检测 `speechSynthesis.getVoices()` 是否包含 `lang` 以 `zh` 开头的 voice，若无可中文 voice 则进入降级模式。

#### Scenario: 检测到中文语音

- **WHEN** 启动时调用 `speechSynthesis.getVoices()` 返回的 voice 列表
- **THEN** 系统 SHALL 检查是否存在 `voice.lang` 以 `'zh'` 开头（如 `'zh-CN'`、`'zh-TW'`）的 voice；存在则将全局标志 `ttsAvailable` 设为 `true`

#### Scenario: 无中文语音降级显示拼音

- **WHEN** `ttsAvailable === false`
- **THEN** 系统 SHALL 在字卡下方显示目标字的 `pinyin` 字段作为视觉提示（如显示 `yī`）， SHALL 在控制台输出警告日志建议用户安装中文 TTS

#### Scenario: voices 异步加载兼容

- **WHEN** 首次调用 `getVoices()` 返回空数组（Chrome 等浏览器需异步加载 voices）
- **THEN** 系统 SHALL 监听 `speechSynthesis.onvoiceschanged` 事件，事件触发后重新检测并更新 `ttsAvailable` 标志

### Requirement: 发音首次触发需用户手势激活

系统 SHALL 在首次用户交互（点击/触摸）后才触发首次 `speechSynthesis.speak()` 调用，以兼容 iOS Safari 的「用户手势激活音频」策略。

#### Scenario: 首次点击激活发音

- **WHEN** 玩家首次点击/触摸游戏任意元素
- **THEN** 系统 SHALL 标记 `speechUnlocked = true`，后续 `speak()` 调用 SHALL 正常工作

#### Scenario: 解锁前不报错

- **WHEN** 页面加载完成但玩家尚未交互
- **THEN** 系统 SHALL NOT 尝试调用 `speechSynthesis.speak()`（避免 iOS 报错）， SHALL NOT 在控制台抛出异常

### Requirement: 发音语速可调

系统 SHALL 在家长设置面板提供发音语速调节（通过 `SpeechSynthesisUtterance.rate` 属性），默认 0.8（慢于正常，适合幼儿）。

#### Scenario: 默认语速 0.8

- **WHEN** 玩家首次进入游戏（未自定义语速）
- **THEN** 每次 `speak()` 创建的 utterance SHALL 设置 `rate = 0.8`

#### Scenario: 家长可调语速

- **WHEN** 家长在设置面板调节语速滑块（范围 0.5-1.5）
- **THEN** 调节值 SHALL 持久化到 `localStorage` 的 `shizi:speechRate` 键，后续 `speak()` SHALL 读取该值作为 `utterance.rate`

### Requirement: 发音可被中断与重播

系统 SHALL 在需要重新播放发音时先调用 `speechSynthesis.cancel()` 取消正在进行的朗读，再调用 `speak()` 播放新发音，避免队列堆积。

#### Scenario: 连续点击重听

- **WHEN** 玩家快速连续点击「再听一次」按钮 3 次
- **THEN** 系统 SHALL 在每次 speak 前调用 `speechSynthesis.cancel()`，仅播放最后一次请求的发音， SHALL NOT 形成 3 次朗读排队

### Requirement: 发音开关受音效总开关控制

系统 SHALL 让发音开关与既有音效开关（`shizi:soundEnabled`）合并 —— 关闭音效时发音也静音。

#### Scenario: 关闭音效后发音也静音

- **WHEN** 家长在设置中关闭音效（`shizi:soundEnabled = false`）
- **THEN** 系统 SHALL NOT 调用 `speechSynthesis.speak()`，所有字音与音效均静音
