# big QR code

一款现代化的 Chrome 扩展，支持生成 **二维码** 和 **条形码**，提供丰富的样式自定义、多格式导出和快捷操作。

> 支持 Chrome Manifest V3（最新版 Chrome 扩展标准）

---

## 功能特性

### 二维码生成
- 实时预览，输入即生成
- 支持任意文本、URL、数字
- **纠错级别**: L / M / Q / H 四档可选
- **前景色 / 背景色** 自定义
- **尺寸调节**: 80px ~ 400px
- **圆角 (border-radius)**: 0px ~ 60px 滑块调节
- 中心 Logo 占位区域开关
- **点击预览区直接复制**图片到剪贴板

### 条形码生成
支持 **8 种主流条码格式**：

| 格式 | 说明 | 输入限制 |
|------|------|---------|
| CODE128 | 通用物流/库存条码 | 任意 ASCII |
| CODE39 | 工业标识 | 大写字母、数字、-. $/+% |
| EAN-13 | 商品条码 | 12 或 13 位数字 |
| EAN-8 | 小商品条码 | 7 或 8 位数字 |
| UPC-A | 北美商品条码 | 11 或 12 位数字 |
| ITF-14 | 物流/仓储条码 | 13 或 14 位数字 |
| CODABAR | 图书馆/血库等 | 数字、$/:+. 和 ABCD |
| Pharmacode | 医药条码 | 1~131070 的整数 |

- **前景色 / 背景色** 自定义
- **高度**、**窄条宽度** 可调
- 显示/隐藏条码下方文字
- 透明背景模式
- **圆角** 0px ~ 30px

### 导出格式
- **PNG** — 无损位图，适合印刷
- **JPG** — 有压缩，适合网页
- **SVG** — 矢量格式，可无损缩放，适合设计稿
- 点击预览区 → 直接复制到剪贴板

### 数据展示
- 数据预览卡片：可开关，显示在二维码下方
- 卡片边框、圆角、字号均可自定义

### 快捷操作
| 按钮 | 功能 |
|------|------|
| 粘贴 | 从剪贴板读取内容 |
| 清空 | 清空输入框 |
| 复制 | 复制纯文本内容 |
| 网址 | 自动填入当前标签页 URL |

### 键盘快捷键
- `Ctrl/Cmd + Enter` — 快速导出 PNG
- `Escape` — 取消输入焦点

### 全局设置
- **记住上次内容** — 重新打开时自动恢复
- **半透明模式** — popup 窗口模糊背景
- **显示虚线边界** — 预览区外围提示
- **自动获取当前网址** — 打开时自动填入当前页 URL
- **默认导出格式** — PNG / JPG / SVG
- **恢复默认设置** — 一键重置

---

## 安装方式

### 开发者模式安装（推荐开发测试用）

1. 克隆或下载本项目到本地
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择项目中的 `chrome_qrCode` 文件夹

### 发布到 Chrome Web Store

1. 打包扩展：`chrome://extensions/` → 点击「打包扩展程序」→ 选择 `chrome_qrCode` 文件夹
2. 上传 `.crx` 文件到 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. 填写应用描述、截图并提交审核

---

## 项目结构

```
chrome_qrCode/
├── manifest.json          # Chrome 扩展清单 (Manifest V3)
├── popup.html              # 扩展主界面（QR码 + 条码 + 设置三个 Tab）
├── js/
│   ├── popup.js           # 全部交互逻辑（原生 JS，无依赖框架）
│   ├── qrcode-gen.min.js  # 二维码生成算法库
│   ├── JsBarcode.all.min.js # 条形码生成算法库
│   └── background.js      # Service Worker (V3 后台脚本)
└── images/
    ├── icon.svg           # 矢量图标母版 (128×128)
    ├── icon.png           # PNG 图标 (由 SVG 导出)
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 技术说明

- **Manifest V3** — 使用 `chrome.storage.local` 替代 V2 的 `localStorage`，Service Worker 替代 Background Page
- **无 jQuery** — 全程使用原生 DOM API + ES6+，代码更轻量
- **第三方库**:
  - [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) — 二维码生成
  - [JsBarcode](https://github.com/lindell/JsBarcode) — 条形码生成
- **字体**: Inter（界面）+ JetBrains Mono（数据/代码），均从 Google Fonts 加载

---

## 版本历史

| 版本 | 说明 |
|------|------|
| 1.0.0 | 全新架构升级至 Manifest V3；新增条形码功能（8 种格式）；全新现代化 UI；多格式导出；丰富样式自定义；快捷操作 |
| 0.1.5 | 旧版（Manifest V2）— 仅支持二维码 PNG/JPG 导出 |

---

## 许可证

MIT License
