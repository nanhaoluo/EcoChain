<template>
  <view class="index-container">
    <!-- 顶部状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <text class="app-title">EcoChain</text>
      <view class="user-info" @click="navigateToProfile">
        <image class="avatar" :src="userAvatar"></image>
      </view>
    </view>
    
    <!-- 主内容区域 -->
    <scroll-view class="content-scroll" scroll-y="true" @scrolltolower="loadMoreData">
      <!-- 环保数据卡片 -->
      <view class="eco-stats-card">
        <view class="stats-header">
          <text class="stats-title">我的环保贡献</text>
          <text class="stats-date">{{ currentDate }}</text>
        </view>
        
        <view class="stats-grid">
          <view class="stats-item">
            <text class="stats-value">{{ userStats.recycleCount }}</text>
            <text class="stats-label">回收次数</text>
          </view>
          
          <view class="stats-item">
            <text class="stats-value">{{ userStats.ecoPoints }}</text>
            <text class="stats-label">环保积分</text>
          </view>
          
          <view class="stats-item">
            <text class="stats-value">{{ userStats.carbonReduction }}kg</text>
            <text class="stats-label">减少碳排放</text>
          </view>
        </view>
      </view>
      
      <!-- 快捷功能区 -->
      <view class="quick-actions">
        <view class="action-item" @click="navigateToScan">
          <view class="action-icon-wrapper primary-bg">
            <image class="action-icon" src="/static/icons/scan-white.png"></image>
          </view>
          <text class="action-text">扫描识别</text>
        </view>
        
        <view class="action-item" @click="navigateToNFT">
          <view class="action-icon-wrapper secondary-bg">
            <image class="action-icon" src="/static/icons/badge-white.png"></image>
          </view>
          <text class="action-text">我的徽章</text>
        </view>
        
        <view class="action-item" @click="navigateToMap">
          <view class="action-icon-wrapper success-bg">
            <image class="action-icon" src="/static/icons/map-white.png"></image>
          </view>
          <text class="action-text">附近回收站</text>
        </view>
        
        <view class="action-item" @click="showCommunity">
          <view class="action-icon-wrapper warning-bg">
            <image class="action-icon" src="/static/icons/community-white.png"></image>
          </view>
          <text class="action-text">环保社区</text>
        </view>
      </view>
      
      <!-- 环保活动 -->
      <view class="section-container">
        <view class="section-header">
          <text class="section-title">环保活动</text>
          <text class="section-more" @click="showMoreActivities">更多</text>
        </view>
        
        <scroll-view class="activities-scroll" scroll-x="true">
          <view 
            v-for="(activity, index) in activities" 
            :key="index" 
            class="activity-card"
            @click="viewActivity(activity)"
          >
            <image class="activity-image" :src="activity.image" mode="aspectFill"></image>
            <view class="activity-info">
              <text class="activity-title">{{ activity.title }}</text>
              <text class="activity-date">{{ activity.date }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <!-- 环保知识 -->
      <view class="section-container">
        <view class="section-header">
          <text class="section-title">环保知识</text>
          <text class="section-more" @click="showMoreKnowledge">更多</text>
        </view>
        
        <view 
          v-for="(article, index) in articles" 
          :key="index" 
          class="knowledge-card"
          @click="viewArticle(article)"
        >
          <view class="knowledge-content">
            <text class="knowledge-title">{{ article.title }}</text>
            <text class="knowledge-desc">{{ article.description }}</text>
            <view class="knowledge-meta">
              <text class="knowledge-source">{{ article.source }}</text>
              <text class="knowledge-time">{{ article.time }}</text>
            </view>
          </view>
          <image class="knowledge-image" :src="article.image" mode="aspectFill"></image>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusBarHeight: 20,
      userAvatar: '/static/images/default-avatar.png',
      currentDate: '',
      userStats: {
        recycleCount: 0,
        ecoPoints: 0,
        carbonReduction: 0
      },
      activities: [
        {
          id: '1',
          title: '社区垃圾分类日',
          date: '4月20日 09:00-12:00',
          image: '/static/images/activity-1.jpg',
          location: '北京市海淀区中关村南大街'
        },
        {
          id: '2',
          title: '环保创意市集',
          date: '4月25日 10:00-17:00',
          image: '/static/images/activity-2.jpg',
          location: '北京市朝阳区三里屯'
        },
        {
          id: '3',
          title: '废旧电子产品回收活动',
          date: '5月1日 全天',
          image: '/static/images/activity-3.jpg',
          location: '北京市各回收站'
        }
      ],
      articles: [
        {
          id: '1',
          title: '垃圾分类从我做起，这些常见误区你中了几个？',
          description: '垃圾分类看似简单，但有很多常见误区。本文为您详细解析垃圾分类的正确方法。',
          source: '环保科普',
          time: '2小时前',
          image: '/static/images/article-1.jpg'
        },
        {
          id: '2',
          title: '塑料污染：海洋生态系统的隐形杀手',
          description: '塑料污染已成为全球性环境问题，每年有数百万吨塑料垃圾流入海洋，对海洋生态系统造成严重威胁。',
          source: '海洋保护协会',
          time: '昨天',
          image: '/static/images/article-2.jpg'
        }
      ]
    };
  },
  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight;
    
    // 设置当前日期
    this.setCurrentDate();
    
    // 获取用户数据
    this.getUserData();
  },
  methods: {
    // 设置当前日期
    setCurrentDate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      this.currentDate = `${year}年${month}月${day}日`;
    },
    
    // 获取用户数据
    async getUserData() {
      try {
        // 显示加载提示
        uni.showLoading({
          title: '加载中'
        });
        
        // 获取用户信息
        const userInfo = uni.getStorageSync('userInfo');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          this.userAvatar = user.avatarUrl || this.userAvatar;
        }
        
        // 获取用户环保数据
        // 在实际应用中，这里会调用API或区块链接口获取数据
        // 这里使用模拟数据
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.userStats = {
          recycleCount: 15,
          ecoPoints: 120,
          carbonReduction: 3.5
        };
        
        // 隐藏加载提示
        uni.hideLoading();
      } catch (error) {
        console.error('Failed to get user data:', error);
        uni.hideLoading();
        uni.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      }
    },
    
    // 导航到个人中心
    navigateToProfile() {
      uni.navigateTo({
        url: '/pages/user/profile'
      });
    },
    
    // 导航到扫描页面
    navigateToScan() {
      uni.switchTab({
        url: '/pages/real-scan/real-scan'
      });
    },
    
    // 导航到NFT页面
    navigateToNFT() {
      uni.switchTab({
        url: '/pages/nft-market/nft-list'
      });
    },
    
    // 导航到地图页面
    navigateToMap() {
      uni.switchTab({
        url: '/pages/recycle-map/map-container'
      });
    },
    
    // 显示环保社区
    showCommunity() {
      uni.showToast({
        title: '环保社区功能即将上线',
        icon: 'none'
      });
    },
    
    // 查看更多活动
    showMoreActivities() {
      uni.showToast({
        title: '更多活动功能即将上线',
        icon: 'none'
      });
    },
    
    // 查看活动详情
    viewActivity(activity) {
      uni.showModal({
        title: activity.title,
        content: `时间：${activity.date}\n地点：${activity.location}\n\n是否参与该活动？`,
        confirmText: '参与',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '报名成功',
              icon: 'success'
            });
          }
        }
      });
    },
    
    // 查看更多知识
    showMoreKnowledge() {
      uni.showToast({
        title: '更多环保知识功能即将上线',
        icon: 'none'
      });
    },
    
    // 查看文章详情
    viewArticle(article) {
      uni.showToast({
        title: '文章详情功能即将上线',
        icon: 'none'
      });
    },
    
    // 加载更多数据
    loadMoreData() {
      // 在实际应用中，这里会加载更多数据
      console.log('Loading more data...');
    }
  }
};
</script>

<style>
.index-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F5F5;
}

.status-bar {
  background-color: #4CAF50;
}

.nav-bar {
  height: 44px;
  background-color: #4CAF50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
}

.app-title {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.content-scroll {
  flex: 1;
  padding: 15px;
}

.eco-stats-card {
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.stats-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.stats-date {
  font-size: 12px;
  color: #999;
}

.stats-grid {
  display: flex;
  justify-content: space-between;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 12px;
  color: #666;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 22%;
}

.action-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 5px;
}

.primary-bg {
  background-color: #4CAF50;
}

.secondary-bg {
  background-color: #2196F3;
}

.success-bg {
  background-color: #FF9800;
}

.warning-bg {
  background-color: #9C27B0;
}

.action-icon {
  width: 24px;
  height: 24px;
}

.action-text {
  font-size: 12px;
  color: #333;
}

.section-container {
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 12px;
  color: #666;
}

.activities-scroll {
  white-space: nowrap;
  height: 160px;
}

.activity-card {
  display: inline-block;
  width: 250px;
  height: 150px;
  border-radius: 10px;
  overflow: hidden;
  margin-right: 10px;
  position: relative;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.activity-image {
  width: 100%;
  height: 100%;
}

.activity-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

.activity-title {
  font-size: 14px;
  color: white;
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.activity-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.knowledge-card {
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.knowledge-content {
  flex: 1;
  margin-right: 10px;
}

.knowledge-title {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.knowledge-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.knowledge-meta {
  display: flex;
  justify-content: space-between;
}

.knowledge-source {
  font-size: 12px;
  color: #4CAF50;
}

.knowledge-time {
  font-size: 12px;
  color: #999;
}

.knowledge-image {
  width: 80px;
  height: 80px;
  border-radius: 5px;
}
</style>
