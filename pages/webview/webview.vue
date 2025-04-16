<template>
  <view class="webview-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">{{ title }}</text>
      <view class="refresh-btn" @click="refreshPage">
        <image class="refresh-icon" src="/static/icons/refresh.png"></image>
      </view>
    </view>
    
    <!-- Web视图 -->
    <web-view 
      :src="url" 
      @message="handleMessage"
      @error="handleError"
    ></web-view>
    
    <!-- 加载提示 -->
    <view class="loading-container" v-if="isLoading">
      <eco-loading text="加载中..."></eco-loading>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      url: '',
      title: '网页',
      isLoading: true
    };
  },
  onLoad(options) {
    // 获取URL
    if (options.url) {
      this.url = decodeURIComponent(options.url);
      console.log('Loading URL:', this.url);
    }
    
    // 获取标题
    if (options.title) {
      this.title = decodeURIComponent(options.title);
    }
  },
  methods: {
    // 处理消息
    handleMessage(e) {
      console.log('WebView message:', e.detail);
      this.isLoading = false;
    },
    
    // 处理错误
    handleError(e) {
      console.error('WebView error:', e.detail);
      this.isLoading = false;
      
      uni.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    },
    
    // 刷新页面
    refreshPage() {
      this.isLoading = true;
      
      // 重新加载URL
      const currentUrl = this.url;
      this.url = '';
      
      setTimeout(() => {
        this.url = currentUrl;
      }, 100);
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style>
.webview-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.nav-bar {
  height: 44px;
  background-color: #4CAF50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  position: relative;
}

.back-btn, .refresh-btn {
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

.refresh-icon {
  width: 20px;
  height: 20px;
}

.page-title {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
  margin: 0 auto;
}

.loading-container {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
