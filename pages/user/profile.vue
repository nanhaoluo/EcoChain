<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image class="user-avatar" :src="userInfo.avatar"></image>
        <view class="user-details">
          <text class="user-name">{{ userInfo.name }}</text>
          <text class="user-level">Lv.{{ userInfo.level }} {{ userInfo.levelName }}</text>
        </view>
      </view>
      
      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.recycleCount }}</text>
          <text class="stat-label">回收次数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.ecoPoints }}</text>
          <text class="stat-label">环保积分</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.nftCount }}</text>
          <text class="stat-label">徽章数量</text>
        </view>
      </view>
    </view>
    
    <!-- 碳足迹卡片 -->
    <view class="carbon-card">
      <view class="card-header">
        <text class="card-title">我的碳足迹</text>
        <text class="card-subtitle">本月已减少碳排放</text>
      </view>
      
      <view class="carbon-value">
        <text class="value-number">{{ carbonReduction }}</text>
        <text class="value-unit">kg</text>
      </view>
      
      <view class="carbon-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercentage + '%' }"></view>
        </view>
        <text class="progress-text">距离下一级还需{{ remainingCarbon }}kg</text>
      </view>
      
      <view class="carbon-equivalent">
        <text class="equivalent-title">相当于</text>
        <view class="equivalent-items">
          <view class="equivalent-item">
            <image class="equivalent-icon" src="/static/icons/tree.png"></image>
            <text class="equivalent-value">{{ treeEquivalent }}</text>
            <text class="equivalent-label">棵树</text>
          </view>
          <view class="equivalent-item">
            <image class="equivalent-icon" src="/static/icons/car.png"></image>
            <text class="equivalent-value">{{ carEquivalent }}</text>
            <text class="equivalent-label">公里</text>
          </view>
          <view class="equivalent-item">
            <image class="equivalent-icon" src="/static/icons/electricity.png"></image>
            <text class="equivalent-value">{{ electricityEquivalent }}</text>
            <text class="equivalent-label">度电</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @click="navigateToWallet">
        <image class="menu-icon" src="/static/icons/wallet.png"></image>
        <text class="menu-text">我的钱包</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="navigateToHistory">
        <image class="menu-icon" src="/static/icons/history.png"></image>
        <text class="menu-text">回收历史</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="navigateToSettings">
        <image class="menu-icon" src="/static/icons/settings.png"></image>
        <text class="menu-text">设置</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="showAbout">
        <image class="menu-icon" src="/static/icons/about.png"></image>
        <text class="menu-text">关于我们</text>
        <text class="menu-arrow">></text>
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <button class="logout-btn" @click="logout">退出登录</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        avatar: '/static/images/default-avatar.png',
        name: '环保达人',
        level: 2,
        levelName: '环保先锋',
        recycleCount: 15,
        ecoPoints: 120,
        nftCount: 2
      },
      carbonReduction: 3.5,
      targetCarbon: 5.0,
      remainingCarbon: 1.5,
      progressPercentage: 70,
      treeEquivalent: 0.7,
      carEquivalent: 14.0,
      electricityEquivalent: 35.0
    };
  },
  onLoad() {
    // 加载用户数据
    this.loadUserData();
    
    // 计算碳减排等效值
    this.calculateEquivalents();
  },
  methods: {
    // 加载用户数据
    async loadUserData() {
      try {
        // 显示加载提示
        uni.showLoading({
          title: '加载中'
        });
        
        // 获取用户信息
        const userInfo = uni.getStorageSync('userInfo');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          this.userInfo.avatar = user.avatarUrl || this.userInfo.avatar;
          this.userInfo.name = user.nickName || this.userInfo.name;
        }
        
        // 获取用户环保数据
        // 在实际应用中，这里会调用API或区块链接口获取数据
        // 这里使用模拟数据
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 计算剩余碳减排量和进度百分比
        this.remainingCarbon = (this.targetCarbon - this.carbonReduction).toFixed(1);
        this.progressPercentage = (this.carbonReduction / this.targetCarbon) * 100;
        
        // 隐藏加载提示
        uni.hideLoading();
      } catch (error) {
        console.error('Failed to load user data:', error);
        uni.hideLoading();
        uni.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      }
    },
    
    // 计算碳减排等效值
    calculateEquivalents() {
      // 1kg碳排放约等于0.2棵树吸收的碳
      this.treeEquivalent = (this.carbonReduction * 0.2).toFixed(1);
      
      // 1kg碳排放约等于4公里汽车行驶
      this.carEquivalent = (this.carbonReduction * 4).toFixed(1);
      
      // 1kg碳排放约等于10度电
      this.electricityEquivalent = (this.carbonReduction * 10).toFixed(1);
    },
    
    // 导航到钱包页面
    navigateToWallet() {
      uni.showToast({
        title: '钱包功能即将上线',
        icon: 'none'
      });
    },
    
    // 导航到历史记录页面
    navigateToHistory() {
      uni.showToast({
        title: '历史记录功能即将上线',
        icon: 'none'
      });
    },
    
    // 导航到设置页面
    navigateToSettings() {
      uni.showToast({
        title: '设置功能即将上线',
        icon: 'none'
      });
    },
    
    // 显示关于我们
    showAbout() {
      uni.showModal({
        title: '关于EcoChain',
        content: 'EcoChain是一款基于区块链技术的碳中和垃圾分类应用，旨在通过AR技术和区块链激励机制，鼓励用户参与垃圾分类回收，为环保事业贡献力量。\n\n版本：1.0.0\n开发团队：EcoChain团队',
        showCancel: false,
        confirmText: '了解了'
      });
    },
    
    // 退出登录
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除用户数据
            uni.removeStorageSync('userInfo');
            uni.removeStorageSync('token');
            
            // 更新全局状态
            getApp().globalData.isLoggedIn = false;
            getApp().globalData.userInfo = null;
            
            // 显示提示
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            });
            
            // 延迟跳转到登录页
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/index/index'
              });
            }, 1500);
          }
        }
      });
    }
  }
};
</script>

<style>
.profile-container {
  padding: 15px;
  background-color: #F5F5F5;
  min-height: 100vh;
}

.user-card {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-avatar {
  width: 70px;
  height: 70px;
  border-radius: 35px;
  margin-right: 15px;
  border: 2px solid #4CAF50;
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

.user-level {
  font-size: 14px;
  color: #4CAF50;
  background-color: #E8F5E9;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.user-stats {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #EEEEEE;
  padding-top: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.carbon-card {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

.card-subtitle {
  font-size: 12px;
  color: #666;
}

.carbon-value {
  display: flex;
  align-items: baseline;
  margin-bottom: 15px;
}

.value-number {
  font-size: 36px;
  font-weight: bold;
  color: #4CAF50;
}

.value-unit {
  font-size: 16px;
  color: #4CAF50;
  margin-left: 5px;
}

.carbon-progress {
  margin-bottom: 20px;
}

.progress-bar {
  height: 10px;
  background-color: #E0E0E0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 5px;
}

.progress-text {
  font-size: 12px;
  color: #666;
  text-align: right;
  display: block;
}

.carbon-equivalent {
  border-top: 1px solid #EEEEEE;
  padding-top: 15px;
}

.equivalent-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.equivalent-items {
  display: flex;
  justify-content: space-between;
}

.equivalent-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.equivalent-icon {
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
}

.equivalent-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.equivalent-label {
  font-size: 12px;
  color: #666;
}

.menu-section {
  background-color: white;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #EEEEEE;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.menu-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.menu-arrow {
  font-size: 16px;
  color: #CCCCCC;
}

.logout-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background-color: white;
  color: #FF5252;
  border-radius: 22px;
  font-size: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>
