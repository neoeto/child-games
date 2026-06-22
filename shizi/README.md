# 识字乐园

面向 3-4 岁幼儿园小班孩子的入门汉字学习游戏。听音辨字 + 亲子认字双模式，100 字分 10 关主题闯关，零图片依赖，Web 语音发音 + HanziWriter 笔顺动画。

## 怎么玩

1. **打开游戏**：双击 `shizi/index.html`（`file://` 协议即可，无需 HTTP server），或从大厅「宝贝益智游戏乐园」点击「识字乐园」卡片进入。
2. **加入主屏幕**（推荐，iPad 体验最佳）：
   - iOS Safari：点分享按钮 →「添加到主屏幕」
   - Android Chrome：菜单 →「添加到主屏幕」
3. **两种模式**：
   - **🎧 听音选字**（孩子独立玩）：听发音 → 4 个选项里选对的字。答错不惩罚，答对庆祝。
   - **👨‍👩‍👧 亲子认字**（家长引导）：大字卡 + 笔顺动画 → 家长考孩子读音 → 点字听标准发音 → 家长判定「会了」或「再练」。
4. **家长设置**：点击右上角「家长」文字 → 按住圆钮 3 秒 → 进入设置面板。
   - 音效与发音开关
   - 发音语速（慢/正常/快，默认 0.8x 适合小朋友）
   - 笔顺播放速度
   - 重置学习进度

## 学习机制

- **100 字 / 10 关**：数字 → 自然 → 天地方位 → 身体 → 家庭 → 动作 → 颜色大小 → 动物 → 食物 → 常用
- **3 星评级**：⭐ 亲子认字家长确认 · ⭐⭐ 听音选对 1 次 · ⭐⭐⭐ 听音累计对 3 次
- **关卡解锁**：上一关 60% 字达 ⭐⭐ 即解锁下一关
- **错字本**：答错的字自动收录，下次优先复习
- **打卡贴纸**：连续 7 天玩得贴纸、每关通关得贴纸

## 技术栈

- 纯 vanilla HTML / CSS / JavaScript（零运行时网络依赖、零构建工具）
- **Web Speech API** (`speechSynthesis`) 生成汉字发音（系统原生，无需素材）
- **Web Audio API** 合成音效（落子、庆祝、胜利）
- **HanziWriter v3.7.3**（本地化部署在 `vendor/`）渲染笔顺动画
- 笔画数据来自 [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)（基于 Make Me a Hanzi，Arphic Public License）
- 移动端触控优先（iPad 是主战场）
- PWA：可「加入主屏幕」全屏启动
- localStorage 持久化进度
- **双击即开**：笔画数据预打包成 `data/chars-data.js`，通过 `<script>` 加载（不走 fetch），`file://` 协议直接打开 `index.html` 即可玩

## 文件结构

```
shizi/
├── index.html              # 入口
├── style.css               # 样式
├── game.js                 # 主控：主界面 / 关卡选择 / 进度查看 / 庆典
├── choice.js               # 听音选字模式
├── recognize.js            # 亲子认字模式（含 HanziWriter 笔顺）
├── audio.js                # speechSynthesis 发音 + Web Audio 音效
├── progress.js             # localStorage 进度系统
├── settings.js             # 家长控制 + baby-gate
├── manifest.json           # PWA 清单
├── data/
│   ├── words.js            # 100 字数据（id/char/pinyin/level/tip）
│   └── chars/*.json        # 100 个笔画数据（HanziWriter 格式）
├── vendor/
│   └── hanzi-writer.min.js # HanziWriter 库（v3.7.3, MIT）
└── resources/
    ├── jojo.png            # JoJo 形象
    └── icons/              # PWA 图标 (192/512)
```

## 推荐设备

- iOS Safari 15+ / Chrome Android 100+ / 桌面 Evergreen 浏览器
- 需系统支持中文 TTS voice（iOS/macOS/Android 均内置；桌面 Linux 可能需额外安装）
- 检测到无中文 TTS 时，认字模式会自动显示拼音作为视觉提示

## 协议致谢

- **HanziWriter 代码**：[MIT License](https://github.com/chanind/hanzi-writer/blob/master/LICENSE)
- **汉字笔画数据**：[Arphic Public License](https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT)（源自 Arphic 字体 1999，未修改使用，商业安全）
- 数据源项目：[Make Me a Hanzi](https://github.com/skishore/makemeahanzi)

## 资源更新（扩展字库）

如需添加更多汉字：

1. 从 hanzi-writer-data 仓库下载笔画数据：
   ```bash
   curl -sL "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/学.json" \
     -o data/chars/学.json
   ```
2. 在 `data/words.js` 中添加对应的字对象。
3. **重新打包笔画数据**（这一步必须，否则新字不会被加载）：
   ```bash
   python3 scripts/build-chars-data.py
   ```
   该脚本读取 `data/chars/*.json` 全部打包进 `data/chars-data.js`（预加载，避免 `file://` 协议下 fetch 失败）。

## 已知限制

- **Mac Chrome 发音问题**：Chrome macOS 的 speechSynthesis 引擎存在已知 bug（NSSpeechSynthesizer 中间层卡死），汉字发音可能无法播放。**推荐使用 Safari** 获得完整体验（笔顺动画 + 汉字发音）。Chrome 下笔顺动画、进度、音效等功能均正常，仅语音朗读可能失效。
- 无 Service Worker 离线缓存（依赖浏览器 HTTP 缓存 + PWA manifest）
- 无多音字完整支持（`pinyin` 字段仅标注默认读音）
- 无语音识别（孩子发音评判由家长主观判定）
- 字库固定 100 字（修改需改 `data/words.js`）
