# EcoChain-Uni 项目说明文档

## 项目概述

EcoChain-Uni 是一款基于 UniApp 的碳中和垃圾分类应用，集成了 AR 扫描识别、区块链积分系统和 LBS 导航功能，旨在鼓励用户参与垃圾分类回收，为环保事业做出贡献。

## 核心功能

### AR 扫描垃圾自动识别
- 调用手机摄像头进行实时扫描
- 使用 TensorFlow Lite 离线模型识别垃圾类型
- 提供 3D 拆解动画展示垃圾组成材质

### 区块链积分系统
- 基于 Polygon Mumbai 测试网的 ERC-1155 合约
- 用户回收垃圾获得积分，积分可兑换 NFT
- NFT 可用于兑换实物奖励（如合作商家优惠券）

### LBS 导航至最近回收站
- 集成高德地图 API
- 显示附近回收站位置和详细信息
- 提供实时导航功能

## 技术架构

### 前端技术栈
- UniApp 框架：实现跨平台开发
- UTS 插件：提供 Android/iOS 原生能力
- Vue.js：前端 UI 框架

### AI 技术
- TensorFlow Lite：垃圾分类模型（6 类垃圾，精度 > 80%）
- 模型量化部署：压缩至 30MB 以内

### 区块链技术
- Polygon Mumbai 测试网
- ERC-1155 智能合约
- 免 Gas 费方案：元交易实现

## 项目结构

```
EcoChain-Uni/
├── common/                 # 公共模块
│   ├── tfjs/              # TensorFlow 相关工具
│   └── web3/              # 区块链相关配置
├── components/             # 全局组件
├── hybrid/                 # 原生插件
│   └── android-ar/        # Android AR 实现
├── mixins/                 # 混入代码
├── pages/                  # 页面
│   ├── index/             # 首页
│   ├── nft-market/        # NFT 市场
│   ├── real-scan/         # AR 扫描
│   ├── recycle-map/       # 回收站地图
│   ├── user/              # 用户中心
│   └── webview/           # Web 视图
├── services/               # 服务层
│   ├── ar-scanner-service.js    # AR 扫描服务
│   ├── blockchain-service.js    # 区块链服务
│   ├── integration-service.js   # 集成服务
│   ├── map-service.js           # 地图服务
│   └── test-service.js          # 测试服务
├── static/                 # 静态资源
│   ├── ar-assets/         # AR 相关资源
│   ├── icons/             # 图标
│   ├── images/            # 图片
│   └── models/            # AI 模型
├── uni_modules/            # UniApp 插件
│   ├── uni-web3/          # Web3 插件
│   └── uts-tensorflow/    # TensorFlow UTS 插件
├── App.vue                 # 应用入口组件
├── main.js                 # 应用入口 JS
├── manifest.json           # 应用配置
├── pages.json              # 页面配置
└── package.json            # 项目依赖
```

## 开发环境配置

### 环境要求
- HBuilderX 3.6.0+
- Node.js 14.0.0+
- Android Studio 4.0+（用于 Android 开发）
- Xcode 12.0+（用于 iOS 开发）
- JDK 1.8+
- Android NDK r21+

### 安装步骤

1. 克隆项目代码
```bash
git clone https://github.com/ecochain/ecochain-uni.git
cd ecochain-uni
```

2. 安装依赖
```bash
npm install
```

3. 在 HBuilderX 中导入项目

4. 配置 Android 开发环境
   - 安装 Android Studio
   - 配置 Android SDK 和 NDK
   - 在 manifest.json 中配置 Android 包名和权限

5. 配置 iOS 开发环境（如需要）
   - 安装 Xcode
   - 配置开发者证书
   - 在 manifest.json 中配置 iOS Bundle ID 和权限

6. 配置高德地图 API
   - 在高德开放平台申请 API Key
   - 在 `services/map-service.js` 中配置 API Key

7. 配置区块链网络
   - 在 Polygon Mumbai 测试网申请测试代币
   - 在 `common/web3/celo-config.js` 中配置网络信息

## 构建与部署

### 开发调试
```bash
# 运行到 Android 模拟器或真机
npm run dev

# 运行到 iOS 模拟器或真机（需要 Mac）
npm run dev
```

### 生产构建
```bash
# 构建 Android APK
npm run build:android

# 构建 iOS IPA（需要 Mac）
npm run build:ios
```

### 测试
```bash
# 运行测试
npm test
```

## 避坑指南

### HBuilderX 插件冲突解决方案
- 确保 UTS 插件版本与 HBuilderX 版本匹配
- 如遇插件冲突，尝试在 manifest.json 中调整插件优先级
- 清除 HBuilderX 缓存：菜单 -> 工具 -> 清除缓存

### Android NDK 编译错误处理
- 确保使用 r21 版本的 NDK
- 检查 build.gradle 中的 NDK 配置
- 如遇 TensorFlow Lite 编译错误，参考 `hybrid/android-ar/build.gradle` 中的配置

### 高德地图 API 鉴权失败应急方案
- 检查 API Key 是否正确配置
- 确认 Key 绑定的包名与应用包名一致
- 如遇鉴权失败，可临时切换到 WebView 中的高德地图网页版

### 区块链合规性风险规避方案
- 避免使用"交易"、"转让"等敏感词汇，改用"环保贡献值"
- NFT 元数据存储于国内云服务，仅哈希上链
- 使用阿里云区块链服务作为备选方案

## 验收标准

- 在华为 Mate 40（鸿蒙 4.0）和 iPhone 15（iOS 17）真机运行无崩溃
- 扫码矿泉水瓶 → 5 秒内返回分类结果 → 生成区块链交易哈希
- 提供 APK/IPA 安装包 + 10 分钟答辩演讲稿（含技术架构图）

## 紧急兜底方案

### AR 模块兜底
- 如原生 AR 无法按期交付，改用 H5+WebAR 方案（基于 8th Wall 或 Zappar）
- 静态图片识别作为备选方案

### 区块链模块兜底
- 如合约开发受阻，改用伪链方案（前端 Mock 数据 + 阿里云区块链服务存证）
- 本地存储积分数据，后续再同步上链

## 联系与支持

如有任何问题或需要技术支持，请联系：

- 技术支持邮箱：support@ecochain.com
- 项目文档：https://docs.ecochain.com
- 问题追踪：https://github.com/ecochain/ecochain-uni/issues

---

Copyright © 2025 EcoChain Team. All Rights Reserved.
