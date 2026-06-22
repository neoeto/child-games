## ADDED Requirements

### Requirement: 100 字字库固定为 10 关主题分组

系统 SHALL 在 `shizi/data/words.js` 中定义固定 100 个汉字，分为 10 关，每关 10 字，按主题分组：①数字 ②自然 ③天地方位 ④身体 ⑤家庭 ⑥动作 ⑦颜色大小 ⑧动物 ⑨食物 ⑩常用。

#### Scenario: 字库总数与关卡分布

- **WHEN** 检查 `shizi/data/words.js` 导出的 WORDS 数组
- **THEN** 数组 SHALL 包含恰好 100 个字对象，每个对象的 `level` 字段为 1-10，每个 level SHALL 恰好包含 10 个字

#### Scenario: 关卡主题对齐

- **WHEN** 检查各关字的 `char` 内容
- **THEN** 各关 SHALL 包含约定的主题字：第1关为「一 二 三 四 五 六 七 八 九 十」；第2关为「日 月 水 火 木 风 云 雨 雪 山」；第3关为「天 地 上 下 左 右 前 后 里 外」；第4关为「人 口 手 足 头 目 耳 牙 心 舌」；第5关为「爸 妈 爷 奶 哥 姐 弟 妹 我 你」；第6关为「走 跑 看 听 说 吃 喝 坐 立 睡」；第7关为「红 黄 蓝 绿 黑 白 大 小 多 少」；第8关为「牛 羊 马 鱼 鸟 虫 狗 猫 鸡 鸭」；第9关为「米 面 饭 菜 果 瓜 糖 水 茶 豆」；第10关为「的 了 在 有 是 好 不 来 去 中」

### Requirement: 每字数据结构含 5 字段

字库中每个字对象 SHALL 包含恰好 5 个字段：`id`（唯一标识）、`char`（汉字）、`pinyin`（带声调拼音）、`level`（关卡 1-10）、`tip`（一句话字义助记）。

#### Scenario: 字对象 schema

- **WHEN** 检查 WORDS 数组中任意一个字对象
- **THEN** 该对象 SHALL 包含字段：`id`（字符串，格式 `w001`-`w100`）、`char`（单个中文字符）、`pinyin`（带声调拼音字符串，如 `"yī"`）、`level`（1-10 数字）、`tip`（≤15 中文字符的助记句）

#### Scenario: id 唯一性

- **WHEN** 检查所有 100 个字的 `id` 字段
- **THEN** 所有 `id` SHALL 唯一不重复，且 SHALL 按 `w001`、`w002`...`w100` 顺序编号

### Requirement: pinyin 字段作为 TTS 降级提示

当浏览器 `speechSynthesis` 不可用或无中文 voice 时，系统 SHALL 在 UI 中显示该字的 `pinyin` 字段作为视觉降级提示。

#### Scenario: TTS 不可用时显示拼音

- **WHEN** 启动时检测 `speechSynthesis.getVoices()` 无 `lang` 以 `zh` 开头的 voice
- **THEN** 系统 SHALL 在字卡下方显示目标字的 `pinyin` 字段（如显示 `yī`），字号 ≥ 24px，作为「这里应该读这个音」的视觉提示

### Requirement: tip 字段用于亲子讲解

亲子认字模式 SHALL 在字卡下方显示当前字的 `tip` 字段内容，作为家长讲解字义时的辅助文案。

#### Scenario: tip 文案展示

- **WHEN** 亲子认字模式加载字 `w001`（char: "一"）
- **THEN** 系统 SHALL 在字卡下方显示 `tip` 字段值（如「一根手指就是一」）， SHALL 以 ≥ 18px 字号、次要颜色（如 `#8a6a4a`）显示

### Requirement: 笔画数据文件与字库一一对应

`shizi/data/chars/` 目录下 SHALL 存在与 `words.js` 中每个 `char` 字段一一对应的 JSON 文件，文件名 = 字符本身（如 `一.json`）。

#### Scenario: 笔画数据文件齐全

- **WHEN** 遍历 `words.js` 的所有 100 个 `char` 字段
- **THEN** `shizi/data/chars/` 目录下 SHALL 存在对应的 `<char>.json` 文件（100 个），每个 JSON SHALL 符合 HanziWriter 字符数据格式（含 `strokes` 数组和 `medians` 数组）

#### Scenario: 笔画数据文件来源

- **WHEN** 检查笔画 JSON 文件的内容
- **THEN** 数据 SHALL 来源于 `hanzi-writer-data@2.0.1` 开源仓库（基于 makemeahanzi 项目，Arphic Public License），SHALL NOT 修改原始数据内容
