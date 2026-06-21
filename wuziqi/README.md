# JoJo 五子棋

面向 4 岁孩子的亲子五子棋游戏。孩子扮演 JoJo 一家（5 个家人循环出场），家长扮演狼。任意 5 颗家人连线 = 孩子赢；5 颗狼连线 = 家长赢。

## 怎么玩

1. **打开游戏**：双击 `index.html`，或把它拖到浏览器窗口里。
2. **加入主屏幕**（推荐，iPad 体验最佳）：
   - iOS Safari：点分享按钮 →「添加到主屏幕」
   - Android Chrome：菜单 →「添加到主屏幕」
   - 之后从桌面图标启动，就是全屏 App 体验，没有浏览器边框。
3. **家长设置**：点击右上角「Parents」文字 → 按住圆形按钮 3 秒 → 进入设置面板。
   - 调节连线提示强度：完整 / 轻柔 / 关闭
   - 开关音效

## 连线提示

只对孩子方（家人）有提示，狼方没有任何提示——这样孩子下棋有辅助，家长凭本事。

- **完整**（默认）：孩子方 hover 或长按空格时，显示黄色光晕 + 连线 + 计数点 + 撒花
- **轻柔**：仅微微光晕
- **关闭**：无任何提示

## 技术栈

- 纯 vanilla HTML / CSS / JavaScript（零依赖、零构建工具）
- 移动端触控优先（iPad 是主战场）
- PWA：可「加入主屏幕」全屏启动
- Web Audio API 生成音效（无外部音频文件）

## 文件结构

```
wuziqi/
├── index.html       # 入口
├── style.css        # 样式
├── game.js          # 主游戏逻辑（落子、判胜、悔棋、重开）
├── hint.js          # 连线提示算法与可视化
├── audio.js         # 音效合成
├── settings.js      # 家长控制 + 设置持久化
├── manifest.json    # PWA 清单
└── resources/       # 角色 PNG + PWA 图标
    ├── jojo.png baba.png mama.png gege.png jiejie.png wolf.png
    └── icons/       # PWA 图标 (192/512)
```
