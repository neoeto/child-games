## ADDED Requirements

### Requirement: HanziWriter 本地化部署

系统 SHALL 将 HanziWriter 库（`hanzi-writer.min.js`）下载到 `shizi/vendor/` 目录本地引用，SHALL NOT 通过 CDN 远程加载。

#### Scenario: 本地引用 HanziWriter

- **WHEN** 检查 `shizi/index.html` 的 `<script>` 标签
- **THEN** HanziWriter 的 src SHALL 指向 `vendor/hanzi-writer.min.js`（相对路径），SHALL NOT 包含 `https://cdn.` 或 `https://unpkg.com` 等远程 URL

#### Scenario: 离线可用

- **WHEN** 设备无网络连接时加载 `shizi/index.html`
- **THEN** HanziWriter 库 SHALL 正常加载并功能可用（不依赖任何远程资源）

### Requirement: 笔画数据本地化存储

系统 SHALL 将所有 100 个汉字的笔画 JSON 数据下载到 `shizi/data/chars/<字>.json`，通过自定义 `charDataLoader` 从本地 fetch 加载，SHALL NOT 使用 HanziWriter 默认的 CDN 数据加载器。

#### Scenario: 笔画数据本地路径

- **WHEN** HanziWriter 需要加载某字的笔画数据
- **THEN** 系统 SHALL 通过 `charDataLoader` 回调从 `data/chars/<字>.json` 本地路径 fetch（如 `data/chars/天.json`），SHALL NOT 请求 `cdn.jsdelivr.net/npm/hanzi-writer-data/`

#### Scenario: 笔画数据文件齐全

- **WHEN** 检查 `shizi/data/chars/` 目录
- **THEN** 目录下 SHALL 存在与字库 `words.js` 中每个 `char` 字段对应的 `.json` 文件（100 个文件），文件格式 SHALL 符合 HanziWriter 字符数据规范（含 `strokes` 数组和 `medians` 数组）

### Requirement: 认字模式自动播放笔顺

亲子认字模式加载新字时 SHALL 自动调用 HanziWriter 的 `animateCharacter()` 播放完整笔顺动画。

#### Scenario: 加载字卡后自动播放笔顺

- **WHEN** 亲子认字模式渲染一个新字
- **THEN** 系统 SHALL 在字卡渲染完成后 300ms 内调用 `writer.animateCharacter()`，逐笔演示书写过程

#### Scenario: 笔顺播放完毕后自动衔接发音

- **WHEN** `animateCharacter()` 返回的 Promise resolve（笔顺动画完成）
- **THEN** 系统 SHALL 自动调用 `speechSynthesis.speak()` 播放该字发音，形成「先看怎么写 → 再听怎么读」的认知链路

### Requirement: 笔顺播放控制按钮

亲子认字模式 SHALL 提供「▶️ 重播笔顺」按钮，允许家长/孩子随时重新播放笔顺动画。

#### Scenario: 点击重播

- **WHEN** 玩家点击「▶️ 重播笔顺」按钮
- **THEN** 系统 SHALL 重新调用 `writer.hideCharacter()` 后 `writer.animateCharacter()`，从第一笔开始完整重播

### Requirement: 笔顺动画速度可调

系统 SHALL 在家长设置面板提供笔顺动画速度调节（通过 HanziWriter 的 `strokeAnimationSpeed` 和 `delayBetweenStrokes` 参数），默认速度适合 3-4 岁孩子观察。

#### Scenario: 默认速度

- **WHEN** 玩家首次进入亲子认字模式（未自定义速度）
- **THEN** HanziWriter 实例 SHALL 使用 `strokeAnimationSpeed: 1.2`（稍快于默认 1.0，适合短注意力）和 `delayBetweenStrokes: 600`（ms，留观察时间）

#### Scenario: 家长可调速度

- **WHEN** 家长在设置面板调节笔顺速度滑块（范围 0.5-2.0）
- **THEN** 调节值 SHALL 持久化到 `localStorage` 的 `shizi:strokeSpeed` 键，下次创建 HanziWriter 实例时 SHALL 读取该值作为 `strokeAnimationSpeed`

### Requirement: 笔顺播放显示描红轮廓

亲子认字模式 SHALL 启用 HanziWriter 的 `showOutline: true` 选项，在笔画动画播放时显示汉字的浅灰色描红轮廓作为视觉引导。

#### Scenario: 显示描红轮廓

- **WHEN** 笔顺动画播放时
- **THEN** 已写出的笔画 SHALL 显示在浅灰色（`outlineColor: '#EEEEEE'`）的字形轮廓之上，帮助孩子理解笔画在字中的位置

### Requirement: 字卡渲染失败降级

当 HanziWriter 加载某字笔画数据失败（如本地 JSON 文件缺失）时，系统 SHALL 降级为纯文字显示，SHALL NOT 阻塞认字模式。

#### Scenario: 笔画数据缺失降级

- **WHEN** `charDataLoader` 的 fetch 请求返回 404 或失败
- **THEN** 系统 SHALL 在字卡区域以纯文字（CSS 渲染）显示该汉字（字号 ≥ 200px），SHALL 在控制台输出警告日志，SHALL NOT 抛出未捕获异常阻塞 UI

#### Scenario: HanziWriter 库加载失败降级

- **WHEN** `vendor/hanzi-writer.min.js` 加载失败（如文件损坏）
- **THEN** 系统 SHALL 检测 `typeof HanziWriter === 'undefined'`，降级为纯文字字卡显示 + 发音播放（无笔顺），SHALL NOT 阻塞整个游戏
