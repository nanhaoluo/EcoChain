<template>
  <view class="nft-list-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <text class="page-title">环保徽章</text>
      <view class="wallet-btn" @click="connectWallet">
        <image class="wallet-icon" src="/static/icons/wallet.png"></image>
      </view>
    </view>
    
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <view class="user-avatar-container">
          <image class="user-avatar" :src="userAvatar"></image>
          <view class="user-level">Lv.{{ userLevel }}</view>
        </view>
        <view class="user-details">
          <text class="user-name">{{ userName }}</text>
          <text class="user-address">{{ formatAddress(userAddress) }}</text>
        </view>
      </view>
      
      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-value">{{ userPoints }}</text>
          <text class="stat-label">环保积分</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userNFTs.length }}</text>
          <text class="stat-label">徽章数量</text>
        </view>
      </view>
    </view>
    
    <!-- NFT列表 -->
    <scroll-view class="nft-list" scroll-y="true" @scrolltolower="loadMoreNFTs">
      <!-- 列表标题 -->
      <view class="list-header">
        <text class="list-title">我的徽章</text>
        <view class="list-filter" @click="showFilterOptions">
          <text class="filter-text">{{ currentFilter }}</text>
          <text class="filter-icon">▼</text>
        </view>
      </view>
      
      <!-- NFT网格 -->
      <view class="nft-grid">
        <view 
          v-for="(nft, index) in filteredNFTs" 
          :key="nft.id" 
          class="nft-item"
          @click="viewNFTDetail(nft)"
        >
          <view class="nft-card">
            <image class="nft-image" :src="nft.image" mode="aspectFill"></image>
            <view class="nft-info">
              <text class="nft-name">{{ nft.name }}</text>
              <view class="nft-rarity" :class="getRarityClass(nft)">
                {{ getRarityText(nft) }}
              </view>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="userNFTs.length === 0 && !isLoading">
          <image class="empty-image" src="/static/images/empty-nft.png"></image>
          <text class="empty-text">您还没有获得环保徽章</text>
          <text class="empty-subtext">回收10次垃圾即可获得一枚徽章</text>
          <button class="scan-btn" @click="goToScan">立即扫描</button>
        </view>
        
        <!-- 加载状态 -->
        <view class="loading-state" v-if="isLoading">
          <eco-loading text="加载中..."></eco-loading>
        </view>
      </view>
    </scroll-view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="action-btn redeem-btn" @click="showRedeemOptions">
        <image class="btn-icon" src="/static/icons/redeem.png"></image>
        <text class="btn-text">兑换积分</text>
      </button>
      
      <button class="action-btn scan-btn" @click="goToScan">
        <image class="btn-icon" src="/static/icons/scan.png"></image>
        <text class="btn-text">扫描回收</text>
      </button>
    </view>
    
    <!-- 筛选选项弹窗 -->
    <view class="filter-popup" v-if="showFilter">
      <view class="filter-overlay" @click="hideFilterOptions"></view>
      <view class="filter-content">
        <view class="filter-header">
          <text class="filter-title">筛选徽章</text>
          <text class="filter-close" @click="hideFilterOptions">×</text>
        </view>
        
        <view class="filter-options">
          <view 
            v-for="(option, index) in filterOptions" 
            :key="index" 
            class="filter-option"
            :class="{ 'selected': currentFilter === option }"
            @click="selectFilter(option)"
          >
            <text class="option-text">{{ option }}</text>
            <text class="option-check" v-if="currentFilter === option">✓</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 兑换选项弹窗 -->
    <view class="redeem-popup" v-if="showRedeem">
      <view class="redeem-overlay" @click="hideRedeemOptions"></view>
      <view class="redeem-content">
        <view class="redeem-header">
          <text class="redeem-title">兑换积分</text>
          <text class="redeem-close" @click="hideRedeemOptions">×</text>
        </view>
        
        <view class="redeem-points">
          <text class="points-label">可用积分</text>
          <text class="points-value">{{ userPoints }}</text>
        </view>
        
        <view class="redeem-options">
          <view 
            v-for="(option, index) in redeemOptions" 
            :key="index" 
            class="redeem-option"
            :class="{ 'disabled': userPoints < option.points }"
            @click="redeemPoints(option)"
          >
            <image class="option-image" :src="option.image" mode="aspectFit"></image>
            <view class="option-info">
              <text class="option-name">{{ option.name }}</text>
              <text class="option-desc">{{ option.description }}</text>
              <text class="option-points">{{ option.points }} 积分</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import blockchainService from '../../services/blockchain-service.js';

export default {
  data() {
    return {
      // 用户信息
      userAvatar: '/static/images/default-avatar.png',
      userName: '环保达人',
      userAddress: '',
      userLevel: 1,
      userPoints: 0,
      
      // NFT数据
      userNFTs: [],
      isLoading: true,
      
      // 筛选相关
      showFilter: false,
      currentFilter: '全部',
      filterOptions: ['全部', '稀有度: 普通', '稀有度: 稀有', '稀有度: 传奇', '最新获得'],
      
      // 兑换相关
      showRedeem: false,
      redeemOptions: [
        {
          id: 'coffee',
          name: '星巴克咖啡券',
          description: '可兑换一杯中杯咖啡',
          points: 100,
          image: '/static/images/coffee.png'
        },
        {
          id: 'movie',
          name: '电影票优惠券',
          description: '电影票9折优惠',
          points: 200,
          image: '/static/images/movie.png'
        },
        {
          id: 'shopping',
          name: '购物优惠券',
          description: '线下环保商店满100减20',
          points: 150,
          image: '/static/images/shopping.png'
        }
      ]
    };
  },
  computed: {
    // 筛选后的NFT列表
    filteredNFTs() {
      if (this.currentFilter === '全部') {
        return this.userNFTs;
      } else if (this.currentFilter === '最新获得') {
        return [...this.userNFTs].sort((a, b) => {
          const dateA = this.getNFTDate(a);
          const dateB = this.getNFTDate(b);
          return new Date(dateB) - new Date(dateA);
        });
      } else {
        // 按稀有度筛选
        const rarity = this.currentFilter.split(': ')[1];
        return this.userNFTs.filter(nft => {
          const rarityAttr = nft.attributes.find(attr => attr.trait_type === '稀有度');
          return rarityAttr && rarityAttr.value === rarity;
        });
      }
    }
  },
  onLoad() {
    // 初始化区块链服务
    this.initBlockchain();
    
    // 监听NFT铸造事件
    uni.$on('mint-nft', this.handleNFTMint);
  },
  onUnload() {
    // 移除事件监听
    uni.$off('mint-nft', this.handleNFTMint);
  },
  methods: {
    // 初始化区块链服务
    async initBlockchain() {
      try {
        this.isLoading = true;
        
        // 初始化区块链服务
        await blockchainService.init();
        
        // 尝试自动连接钱包
        if (uni.getStorageSync('walletConnected')) {
          await this.connectWallet();
        } else {
          // 如果没有连接钱包，从本地存储获取数据
          blockchainService.getUserDataFromLocal();
          this.updateUserData();
        }
        
        this.isLoading = false;
      } catch (error) {
        console.error('Failed to initialize blockchain:', error);
        this.isLoading = false;
        
        uni.showToast({
          title: '初始化失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 连接钱包
    async connectWallet() {
      try {
        this.isLoading = true;
        
        // 连接钱包
        const address = await blockchainService.connectWallet();
        
        if (address) {
          this.userAddress = address;
          
          // 保存连接状态
          uni.setStorageSync('walletConnected', true);
          
          // 更新用户数据
          this.updateUserData();
          
          uni.showToast({
            title: '钱包已连接',
            icon: 'success'
          });
        }
        
        this.isLoading = false;
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        this.isLoading = false;
        
        uni.showToast({
          title: '连接失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 更新用户数据
    updateUserData() {
      // 更新用户积分
      this.userPoints = blockchainService.userPoints;
      
      // 更新用户NFT
      this.userNFTs = blockchainService.userNFTs;
      
      // 更新用户等级
      this.updateUserLevel();
    },
    
    // 更新用户等级
    updateUserLevel() {
      // 根据NFT数量和积分计算用户等级
      const nftCount = this.userNFTs.length;
      const points = this.userPoints;
      
      if (nftCount >= 5 || points >= 1000) {
        this.userLevel = 5;
      } else if (nftCount >= 4 || points >= 800) {
        this.userLevel = 4;
      } else if (nftCount >= 3 || points >= 500) {
        this.userLevel = 3;
      } else if (nftCount >= 2 || points >= 200) {
        this.userLevel = 2;
      } else {
        this.userLevel = 1;
      }
    },
    
    // 处理NFT铸造事件
    handleNFTMint(data) {
      console.log('NFT minted:', data);
      
      // 更新用户数据
      this.updateUserData();
      
      // 显示提示
      uni.showToast({
        title: '恭喜获得新徽章！',
        icon: 'success'
      });
    },
    
    // 加载更多NFT
    loadMoreNFTs() {
      // 在实际应用中，这里会加载更多NFT
      console.log('Loading more NFTs...');
    },
    
    // 查看NFT详情
    viewNFTDetail(nft) {
      uni.navigateTo({
        url: `/pages/nft-market/nft-detail?id=${nft.id}`
      });
    },
    
    // 显示筛选选项
    showFilterOptions() {
      this.showFilter = true;
    },
    
    // 隐藏筛选选项
    hideFilterOptions() {
      this.showFilter = false;
    },
    
    // 选择筛选选项
    selectFilter(option) {
      this.currentFilter = option;
      this.hideFilterOptions();
    },
    
    // 显示兑换选项
    showRedeemOptions() {
      this.showRedeem = true;
    },
    
    // 隐藏兑换选项
    hideRedeemOptions() {
      this.showRedeem = false;
    },
    
    // 兑换积分
    async redeemPoints(option) {
      // 检查积分是否足够
      if (this.userPoints < option.points) {
        uni.showToast({
          title: '积分不足',
          icon: 'none'
        });
        return;
      }
      
      try {
        // 显示加载提示
        uni.showLoading({
          title: '兑换中...'
        });
        
        // 兑换积分
        await blockchainService.redeemPoints(option.points, option.id);
        
        // 更新用户数据
        this.updateUserData();
        
        // 隐藏加载提示
        uni.hideLoading();
        
        // 隐藏兑换选项
        this.hideRedeemOptions();
        
        // 显示成功提示
        uni.showModal({
          title: '兑换成功',
          content: `您已成功兑换${option.name}，请在"我的-优惠券"中查看`,
          showCancel: false
        });
      } catch (error) {
        console.error('Failed to redeem points:', error);
        uni.hideLoading();
        
        uni.showToast({
          title: '兑换失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 前往扫描页面
    goToScan() {
      uni.switchTab({
        url: '/pages/real-scan/real-scan'
      });
    },
    
    // 格式化钱包地址
    formatAddress(address) {
      if (!address) return '';
      return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    },
    
    // 获取NFT稀有度类名
    getRarityClass(nft) {
      const rarityAttr = nft.attributes.find(attr => attr.trait_type === '稀有度');
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
    
    // 获取NFT稀有度文本
    getRarityText(nft) {
      const rarityAttr = nft.attributes.find(attr => attr.trait_type === '稀有度');
      return rarityAttr ? rarityAttr.value : '';
    },
    
    // 获取NFT日期
    getNFTDate(nft) {
      const dateAttr = nft.attributes.find(attr => attr.trait_type === '发行日期');
      return dateAttr ? dateAttr.value : '';
    }
  }
};
</script>

<style>
.nft-list-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
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

.page-title {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.wallet-btn {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wallet-icon {
  width: 24px;
  height: 24px;
}

.user-card {
  background-color: white;
  padding: 15px;
  margin: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.user-avatar-container {
  position: relative;
  margin-right: 15px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  border: 2px solid #4CAF50;
}

.user-level {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #4CAF50;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

.user-address {
  font-size: 14px;
  color: #666;
}

.user-stats {
  display: flex;
  border-top: 1px solid #EEEEEE;
  padding-top: 15px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.nft-list {
  flex: 1;
  padding: 0 15px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.list-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.list-filter {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 5px 10px;
  border-radius: 15px;
}

.filter-text {
  font-size: 14px;
  color: #666;
  margin-right: 5px;
}

.filter-icon {
  font-size: 12px;
  color: #666;
}

.nft-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -5px;
}

.nft-item {
  width: 50%;
  padding: 0 5px;
  margin-bottom: 15px;
  box-sizing: border-box;
}

.nft-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.nft-image {
  width: 100%;
  height: 150px;
}

.nft-info {
  padding: 10px;
}

.nft-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

.nft-rarity {
  display: inline-block;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
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

.empty-state {
  width: 100%;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-image {
  width: 120px;
  height: 120px;
  margin-bottom: 15px;
}

.empty-text {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
}

.empty-subtext {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.scan-btn {
  background-color: #4CAF50;
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
}

.loading-state {
  width: 100%;
  padding: 30px 0;
  display: flex;
  justify-content: center;
}

.bottom-bar {
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

.redeem-btn {
  background-color: #F5F5F5;
  color: #333;
}

.scan-btn {
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

.filter-popup, .redeem-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.filter-overlay, .redeem-overlay {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
}

.filter-content, .redeem-content {
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  padding: 15px;
}

.filter-header, .redeem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-title, .redeem-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.filter-close, .redeem-close {
  font-size: 20px;
  color: #666;
}

.filter-options {
  max-height: 300px;
  overflow-y: auto;
}

.filter-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #EEEEEE;
}

.filter-option:last-child {
  border-bottom: none;
}

.option-text {
  font-size: 16px;
  color: #333;
}

.option-check {
  font-size: 16px;
  color: #4CAF50;
}

.filter-option.selected {
  color: #4CAF50;
}

.redeem-points {
  background-color: #F5F5F5;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-label {
  font-size: 14px;
  color: #666;
}

.points-value {
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
}

.redeem-options {
  max-height: 400px;
  overflow-y: auto;
}

.redeem-option {
  display: flex;
  padding: 15px 0;
  border-bottom: 1px solid #EEEEEE;
}

.redeem-option:last-child {
  border-bottom: none;
}

.redeem-option.disabled {
  opacity: 0.5;
}

.option-image {
  width: 60px;
  height: 60px;
  border-radius: 5px;
  margin-right: 15px;
}

.option-info {
  flex: 1;
}

.option-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

.option-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  display: block;
}

.option-points {
  font-size: 14px;
  color: #4CAF50;
  font-weight: bold;
}
</style>
