<template>
  <view class="nft-detail-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">徽章详情</text>
      <view class="share-btn" @click="shareNFT">
        <image class="share-icon" src="/static/icons/share.png"></image>
      </view>
    </view>
    
    <!-- NFT展示区域 -->
    <view class="nft-showcase">
      <image class="nft-image" :src="nftData.image" mode="aspectFit"></image>
      
      <!-- 稀有度标签 -->
      <view class="rarity-badge" :class="getRarityClass()">
        {{ getRarityText() }}
      </view>
    </view>
    
    <!-- NFT信息 -->
    <view class="nft-info-card">
      <view class="nft-header">
        <text class="nft-name">{{ nftData.name }}</text>
        <view class="nft-id">#{{ nftData.id }}</view>
      </view>
      
      <text class="nft-description">{{ nftData.description }}</text>
      
      <!-- 属性列表 -->
      <view class="attributes-section">
        <text class="section-title">属性</text>
        <view class="attributes-grid">
          <view 
            v-for="(attr, index) in nftData.attributes" 
            :key="index" 
            class="attribute-item"
          >
            <text class="attribute-type">{{ attr.trait_type }}</text>
            <text class="attribute-value">{{ attr.value }}</text>
          </view>
        </view>
      </view>
      
      <!-- 区块链信息 -->
      <view class="blockchain-section">
        <text class="section-title">区块链信息</text>
        
        <view class="blockchain-info">
          <view class="info-row">
            <text class="info-label">合约地址</text>
            <view class="info-value-container">
              <text class="info-value">{{ formatAddress(contractAddress) }}</text>
              <view class="copy-btn" @click="copyToClipboard(contractAddress)">复制</view>
            </view>
          </view>
          
          <view class="info-row">
            <text class="info-label">Token ID</text>
            <view class="info-value-container">
              <text class="info-value">{{ nftData.id }}</text>
              <view class="copy-btn" @click="copyToClipboard(nftData.id)">复制</view>
            </view>
          </view>
          
          <view class="info-row">
            <text class="info-label">区块链</text>
            <text class="info-value">Polygon Mumbai</text>
          </view>
          
          <view class="info-row">
            <text class="info-label">标准</text>
            <text class="info-value">ERC-1155</text>
          </view>
        </view>
      </view>
      
      <!-- 环保贡献 -->
      <view class="contribution-section">
        <text class="section-title">环保贡献</text>
        
        <view class="contribution-stats">
          <view class="contribution-item">
            <view class="contribution-icon-wrapper">
              <image class="contribution-icon" src="/static/icons/recycle.png"></image>
            </view>
            <view class="contribution-info">
              <text class="contribution-value">{{ getRecycleCount() }}</text>
              <text class="contribution-label">回收次数</text>
            </view>
          </view>
          
          <view class="contribution-item">
            <view class="contribution-icon-wrapper">
              <image class="contribution-icon" src="/static/icons/carbon.png"></image>
            </view>
            <view class="contribution-info">
              <text class="contribution-value">{{ getCarbonReduction() }}</text>
              <text class="contribution-label">减碳量</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <button class="action-btn view-explorer-btn" @click="viewOnExplorer">
        <image class="btn-icon" src="/static/icons/explorer.png"></image>
        <text class="btn-text">在区块浏览器查看</text>
      </button>
      
      <button class="action-btn display-btn" @click="displayARModel">
        <image class="btn-icon" src="/static/icons/ar-view.png"></image>
        <text class="btn-text">AR展示</text>
      </button>
    </view>
    
    <!-- AR模型展示弹窗 -->
    <view class="ar-popup" v-if="showARModel">
      <view class="ar-overlay" @click="hideARModel"></view>
      <view class="ar-content">
        <view class="ar-header">
          <text class="ar-title">AR展示</text>
          <text class="ar-close" @click="hideARModel">×</text>
        </view>
        
        <view class="ar-model-container">
          <!-- 在实际应用中，这里会使用Three.js或其他3D库渲染模型 -->
          <!-- 这里使用图片模拟 -->
          <image 
            class="ar-model-image" 
            :src="getARModelImage()" 
            mode="aspectFit"
          ></image>
          
          <!-- 模型控制 -->
          <view class="model-controls">
            <view class="control-btn rotate-left-btn" @click="rotateModel('left')">
              <text class="control-icon">↺</text>
            </view>
            
            <view class="control-btn zoom-in-btn" @click="zoomModel('in')">
              <text class="control-icon">+</text>
            </view>
            
            <view class="control-btn zoom-out-btn" @click="zoomModel('out')">
              <text class="control-icon">-</text>
            </view>
            
            <view class="control-btn rotate-right-btn" @click="rotateModel('right')">
              <text class="control-icon">↻</text>
            </view>
          </view>
        </view>
        
        <button class="place-ar-btn" @click="placeInRealWorld">
          <image class="btn-icon" src="/static/icons/ar-place.png"></image>
          <text class="btn-text">放置在真实世界</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import blockchainService from '../../services/blockchain-service.js';

export default {
  data() {
    return {
      nftId: '',
      nftData: {
        id: '',
        name: '',
        description: '',
        image: '',
        attributes: []
      },
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      showARModel: false,
      modelRotation: 0,
      modelScale: 1.0
    };
  },
  onLoad(options) {
    // 获取NFT ID
    if (options.id) {
      this.nftId = options.id;
      
      // 加载NFT数据
      this.loadNFTData();
    }
  },
  methods: {
    // 加载NFT数据
    async loadNFTData() {
      try {
        // 显示加载提示
        uni.showLoading({
          title: '加载中...'
        });
        
        // 初始化区块链服务
        if (!blockchainService.isInitialized) {
          await blockchainService.init();
        }
        
        // 获取用户NFT
        const nfts = blockchainService.userNFTs;
        
        // 查找指定ID的NFT
        const nft = nfts.find(item => item.id.toString() === this.nftId.toString());
        
        if (nft) {
          this.nftData = nft;
        } else {
          // 如果在用户NFT中找不到，尝试从区块链获取
          await this.loadNFTFromBlockchain();
        }
        
        // 隐藏加载提示
        uni.hideLoading();
      } catch (error) {
        console.error('Failed to load NFT data:', error);
        uni.hideLoading();
        
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 从区块链加载NFT数据
    async loadNFTFromBlockchain() {
      try {
        // 在实际应用中，这里会从区块链获取NFT数据
        // 这里使用模拟数据
        this.nftData = {
          id: this.nftId,
          name: `环保徽章 #${this.nftId}`,
          description: this.getNFTDescription(this.nftId),
          image: `/static/nft/badge_${this.nftId}.png`,
          attributes: this.getNFTAttributes(this.nftId),
          metadataURI: `https://api.ecochain.com/metadata/${this.nftId}`
        };
      } catch (error) {
        console.error('Failed to load NFT from blockchain:', error);
        throw error;
      }
    },
    
    // 获取NFT描述
    getNFTDescription(tokenId) {
      const descriptions = [
        '初级环保徽章，表彰您的环保意识和行动。',
        '中级环保徽章，表彰您持续的环保贡献。',
        '高级环保徽章，表彰您在环保领域的杰出表现。',
        '专家级环保徽章，表彰您在环保领域的专业知识和贡献。',
        '大师级环保徽章，表彰您在环保领域的卓越成就。'
      ];
      
      const index = Math.min(tokenId - 1, descriptions.length - 1);
      return descriptions[index];
    },
    
    // 获取NFT属性
    getNFTAttributes(tokenId) {
      const levels = ['初级', '中级', '高级', '专家级', '大师级'];
      const rarities = ['普通', '普通', '稀有', '稀有', '传奇'];
      const carbonReductions = [5, 15, 30, 50, 100];
      
      const index = Math.min(tokenId - 1, levels.length - 1);
      
      return [
        {
          trait_type: '等级',
          value: levels[index]
        },
        {
          trait_type: '稀有度',
          value: rarities[index]
        },
        {
          trait_type: '减碳量',
          value: `${carbonReductions[index]}kg`
        },
        {
          trait_type: '发行日期',
          value: new Date().toISOString().split('T')[0]
        }
      ];
    },
    
    // 获取稀有度类名
    getRarityClass() {
      const rarityAttr = this.nftData.attributes.find(attr => attr.trait_type === '稀有度');
      if (!rarityAttr) return '';
      
      switch (rarityAttr.value) {
        case '普通':
          return 'rarity-common';
        case '稀有':
          return 'rarity-rare';
        case '传奇':
          return 'rarity-legendary';
        default:
          return '';
      }
    },
    
    // 获取稀有度文本
    getRarityText() {
      const rarityAttr = this.nftData.attributes.find(attr => attr.trait_type === '稀有度');
      return rarityAttr ? rarityAttr.value : '';
    },
    
    // 获取回收次数
    getRecycleCount() {
      // 根据NFT ID计算回收次数
      return this.nftData.id * 10;
    },
    
    // 获取减碳量
    getCarbonReduction() {
      const carbonAttr = this.nftData.attributes.find(attr => attr.trait_type === '减碳量');
      return carbonAttr ? carbonAttr.value : '0kg';
    },
    
    // 格式化地址
    formatAddress(address) {
      if (!address) return '';
      return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    },
    
    // 复制到剪贴板
    copyToClipboard(text) {
      uni.setClipboardData({
        data: text.toString(),
        success: () => {
          uni.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    },
    
    // 在区块浏览器中查看
    viewOnExplorer() {
      // 构建区块浏览器URL
      const explorerUrl = `https://mumbai.polygonscan.com/token/${this.contractAddress}?a=${this.nftData.id}`;
      
      // 打开URL
      uni.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(explorerUrl)}`
      });
    },
    
    // 显示AR模型
    displayARModel() {
      this.showARModel = true;
    },
    
    // 隐藏AR模型
    hideARModel() {
      this.showARModel = false;
    },
    
    // 获取AR模型图片
    getARModelImage() {
      // 根据NFT ID返回对应的模型图片
      return `/static/ar-models/badge_${this.nftData.id}.png`;
    },
    
    // 旋转模型
    rotateModel(direction) {
      if (direction === 'left') {
        this.modelRotation -= 90;
      } else {
        this.modelRotation += 90;
      }
      
      // 更新模型旋转
      console.log('Model rotation:', this.modelRotation);
    },
    
    // 缩放模型
    zoomModel(direction) {
      if (direction === 'in') {
        this.modelScale = Math.min(this.modelScale + 0.1, 2.0);
      } else {
        this.modelScale = Math.max(this.modelScale - 0.1, 0.5);
      }
      
      // 更新模型缩放
      console.log('Model scale:', this.modelScale);
    },
    
    // 放置在真实世界
    placeInRealWorld() {
      // 隐藏AR模型弹窗
      this.hideARModel();
      
      // 跳转到AR场景
      uni.navigateTo({
        url: `/pages/ar-scene/ar-scene?nftId=${this.nftData.id}`
      });
    },
    
    // 分享NFT
    shareNFT() {
      uni.showShareMenu({
        withShareTicket: true,
        success: () => {
          console.log('Show share menu success');
        },
        fail: (err) => {
          console.error('Show share menu failed:', err);
          
          // 如果原生分享菜单不可用，显示自定义分享选项
          uni.showModal({
            title: '分享',
            content: '分享您的环保徽章到社交媒体',
            showCancel: true,
            confirmText: '分享',
            success: (res) => {
              if (res.confirm) {
                uni.showToast({
                  title: '分享功能即将上线',
                  icon: 'none'
                });
              }
            }
          });
        }
      });
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style>
.nft-detail-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F5F5F5;
}

.nav-bar {
  height: 44px;
  background-color: #4CAF50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
}

.back-btn, .share-btn {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.back-icon {
  font-size: 20px;
  color: white;
}

.share-icon {
  width: 20px;
  height: 20px;
}

.page-title {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.nft-showcase {
  position: relative;
  width: 100%;
  height: 300px;
  background-color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nft-image {
  max-width: 100%;
  max-height: 100%;
}

.rarity-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.rarity-common {
  background-color: #E0E0E0;
  color: #333;
}

.rarity-rare {
  background-color: #2196F3;
  color: white;
}

.rarity-legendary {
  background-color: #FFC107;
  color: white;
}

.nft-info-card {
  flex: 1;
  background-color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  margin-top: -20px;
  padding: 20px;
  z-index: 1;
}

.nft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.nft-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.nft-id {
  font-size: 14px;
  color: #666;
  background-color: #F5F5F5;
  padding: 3px 8px;
  border-radius: 10px;
}

.nft-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.attributes-section {
  margin-bottom: 20px;
}

.attributes-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -5px;
}

.attribute-item {
  width: calc(50% - 10px);
  margin: 0 5px 10px;
  background-color: #F5F5F5;
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
}

.attribute-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  display: block;
}

.attribute-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.blockchain-section {
  margin-bottom: 20px;
}

.blockchain-info {
  background-color: #F5F5F5;
  border-radius: 10px;
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value-container {
  display: flex;
  align-items: center;
}

.info-value {
  font-size: 14px;
  color: #333;
  margin-right: 5px;
}

.copy-btn {
  font-size: 12px;
  color: #4CAF50;
  background-color: #E8F5E9;
  padding: 2px 5px;
  border-radius: 5px;
}

.contribution-section {
  margin-bottom: 20px;
}

.contribution-stats {
  display: flex;
  justify-content: space-between;
}

.contribution-item {
  display: flex;
  align-items: center;
}

.contribution-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #E8F5E9;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
}

.contribution-icon {
  width: 24px;
  height: 24px;
}

.contribution-info {
  display: flex;
  flex-direction: column;
}

.contribution-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.contribution-label {
  font-size: 12px;
  color: #666;
}

.bottom-actions {
  display: flex;
  padding: 15px;
  background-color: white;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.action-btn {
  flex: 1;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 22px;
  margin: 0 5px;
}

.view-explorer-btn {
  background-color: #F5F5F5;
  color: #333;
}

.display-btn {
  background-color: #4CAF50;
  color: white;
}

.btn-icon {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}

.btn-text {
  font-size: 14px;
}

.ar-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.ar-overlay {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
}

.ar-content {
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  padding: 15px;
}

.ar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.ar-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.ar-close {
  font-size: 20px;
  color: #666;
}

.ar-model-container {
  position: relative;
  width: 100%;
  height: 300px;
  background-color: #F5F5F5;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 15px;
}

.ar-model-image {
  width: 100%;
  height: 100%;
}

.model-controls {
  position: absolute;
  bottom: 15px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 5px;
}

.control-icon {
  font-size: 20px;
  color: #333;
}

.place-ar-btn {
  width: 100%;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #4CAF50;
  color: white;
  border-radius: 22px;
}
</style>
