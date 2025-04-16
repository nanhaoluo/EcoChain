<template>
  <view class="result-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">识别结果</text>
    </view>
    
    <!-- 结果内容 -->
    <scroll-view class="result-content" scroll-y="true">
      <!-- 结果卡片 -->
      <eco-card class="result-card">
        <!-- 物品信息 -->
        <view class="item-info">
          <view class="item-header">
            <text class="item-name">{{ result.label }}</text>
            <view class="item-tag" :class="{ 'recyclable': result.recyclable, 'non-recyclable': !result.recyclable }">
              {{ result.recyclable ? '可回收物' : '不可回收物' }}
            </view>
          </view>
          
          <view class="item-details">
            <view class="detail-item">
              <text class="detail-label">材质类型</text>
              <text class="detail-value">{{ result.materialType }}</text>
            </view>
            
            <view class="detail-item">
              <text class="detail-label">自然分解时间</text>
              <text class="detail-value">{{ result.decompositionTime }}</text>
            </view>
            
            <view class="detail-item">
              <text class="detail-label">回收方法</text>
              <text class="detail-value">{{ result.recyclingMethod }}</text>
            </view>
          </view>
        </view>
      </eco-card>
      
      <!-- 环保贡献 -->
      <eco-card class="contribution-card">
        <view class="card-header">
          <text class="card-title">环保贡献</text>
        </view>
        
        <view class="contribution-content">
          <view class="contribution-item">
            <view class="contribution-icon-wrapper">
              <image class="contribution-icon" src="/static/icons/points.png"></image>
            </view>
            <view class="contribution-info">
              <text class="contribution-value">+{{ earnedPoints }}</text>
              <text class="contribution-label">环保积分</text>
            </view>
          </view>
          
          <view class="contribution-item">
            <view class="contribution-icon-wrapper">
              <image class="contribution-icon" src="/static/icons/carbon.png"></image>
            </view>
            <view class="contribution-info">
              <text class="contribution-value">-{{ carbonReduction }}kg</text>
              <text class="contribution-label">碳排放</text>
            </view>
          </view>
        </view>
        
        <view class="progress-section">
          <view class="progress-header">
            <text class="progress-title">距离下一个徽章</text>
            <text class="progress-value">{{ remainingCount }}/10次</text>
          </view>
          
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercentage + '%' }"></view>
          </view>
        </view>
      </eco-card>
      
      <!-- 回收指南 -->
      <eco-card class="guide-card">
        <view class="card-header">
          <text class="card-title">回收指南</text>
        </view>
        
        <view class="guide-steps">
          <view class="guide-step">
            <view class="step-number">1</view>
            <view class="step-content">
              <text class="step-title">清洁处理</text>
              <text class="step-desc">{{ getCleaningGuide() }}</text>
            </view>
          </view>
          
          <view class="guide-step">
            <view class="step-number">2</view>
            <view class="step-content">
              <text class="step-title">分类投放</text>
              <text class="step-desc">{{ getDisposalGuide() }}</text>
            </view>
          </view>
          
          <view class="guide-step">
            <view class="step-number">3</view>
            <view class="step-content">
              <text class="step-title">回收利用</text>
              <text class="step-desc">{{ getRecyclingGuide() }}</text>
            </view>
          </view>
        </view>
      </eco-card>
      
      <!-- 附近回收站 -->
      <eco-card class="nearby-card">
        <view class="card-header">
          <text class="card-title">附近回收站</text>
          <text class="view-more" @click="viewAllStations">查看全部</text>
        </view>
        
        <view class="station-list">
          <view class="station-item" v-for="(station, index) in nearbyStations" :key="index" @click="navigateToStation(station)">
            <view class="station-info">
              <text class="station-name">{{ station.name }}</text>
              <text class="station-address">{{ station.address }}</text>
              <view class="station-tags">
                <view class="station-tag" v-for="(tag, tagIndex) in station.tags" :key="tagIndex">{{ tag }}</view>
              </view>
            </view>
            <view class="station-distance">
              <text class="distance-value">{{ formatDistance(station.distance) }}</text>
              <text class="navigate-text">导航</text>
            </view>
          </view>
        </view>
      </eco-card>
    </scroll-view>
    
    <!-- 底部按钮 -->
    <view class="bottom-actions">
      <button class="action-btn scan-again-btn" @click="scanAgain">再次扫描</button>
      <button class="action-btn share-btn" @click="shareResult">分享成果</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      result: null,
      earnedPoints: 0,
      carbonReduction: 0,
      recycleCount: 0,
      remainingCount: 0,
      progressPercentage: 0,
      nearbyStations: []
    };
  },
  onLoad(options) {
    // 解析传递的数据
    if (options.data) {
      this.result = JSON.parse(decodeURIComponent(options.data));
      console.log('Result data:', this.result);
    }
    
    // 获取用户数据
    this.loadUserData();
    
    // 获取附近回收站
    this.loadNearbyStations();
  },
  methods: {
    // 加载用户数据
    loadUserData() {
      try {
        // 获取回收次数
        this.recycleCount = uni.getStorageSync('recycleCount') || 0;
        
        // 计算距离下一个徽章的剩余次数
        this.remainingCount = 10 - (this.recycleCount % 10);
        if (this.remainingCount === 10) this.remainingCount = 0;
        
        // 计算进度百分比
        this.progressPercentage = ((10 - this.remainingCount) / 10) * 100;
        
        // 计算获得的积分
        this.calculateEarnedPoints();
        
        // 计算减少的碳排放
        this.calculateCarbonReduction();
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    },
    
    // 计算获得的积分
    calculateEarnedPoints() {
      if (!this.result) return;
      
      // 基础积分
      let points = this.result.recyclable ? 10 : 5;
      
      // 根据物品类型调整积分
      switch (this.result.label) {
        case '塑料':
          points += 2;
          break;
        case '纸类':
          points += 1;
          break;
        case '金属':
          points += 3;
          break;
        case '玻璃':
          points += 2;
          break;
        case '厨余垃圾':
          points += 1;
          break;
      }
      
      this.earnedPoints = points;
    },
    
    // 计算减少的碳排放
    calculateCarbonReduction() {
      if (!this.result) return;
      
      // 根据物品类型计算减少的碳排放（kg）
      let carbon = 0;
      
      switch (this.result.label) {
        case '塑料':
          carbon = 0.5;
          break;
        case '纸类':
          carbon = 0.3;
          break;
        case '金属':
          carbon = 0.8;
          break;
        case '玻璃':
          carbon = 0.4;
          break;
        case '厨余垃圾':
          carbon = 0.2;
          break;
        default:
          carbon = 0.1;
      }
      
      this.carbonReduction = carbon;
    },
    
    // 加载附近回收站
    loadNearbyStations() {
      // 模拟数据
      this.nearbyStations = [
        {
          id: '1',
          name: '社区环保回收站',
          address: '北京市海淀区中关村南大街5号',
          distance: 500,
          tags: ['社区回收站', '24小时']
        },
        {
          id: '2',
          name: '绿色回收中心',
          address: '北京市海淀区学院路15号',
          distance: 1200,
          tags: ['大型回收中心', '有补贴']
        }
      ];
    },
    
    // 获取清洁处理指南
    getCleaningGuide() {
      if (!this.result) return '';
      
      switch (this.result.label) {
        case '塑料':
          return '清洗干净，去除标签，压扁以节省空间。';
        case '纸类':
          return '确保干燥，去除不可回收的部分（如塑料窗口、金属装订）。';
        case '金属':
          return '清洗干净，去除非金属部分，压扁以节省空间。';
        case '玻璃':
          return '清洗干净，去除盖子和标签，小心处理避免破碎。';
        case '有害垃圾':
          return '密封包装，防止泄漏，不要与其他垃圾混合。';
        case '厨余垃圾':
          return '沥干水分，去除不可降解物质，如塑料袋、橡皮筋等。';
        default:
          return '根据物品特性进行适当清洁处理。';
      }
    },
    
    // 获取分类投放指南
    getDisposalGuide() {
      if (!this.result) return '';
      
      switch (this.result.label) {
        case '塑料':
          return '投放到可回收物垃圾桶，或专门的塑料回收容器。';
        case '纸类':
          return '投放到可回收物垃圾桶，或专门的纸类回收容器。';
        case '金属':
          return '投放到可回收物垃圾桶，或专门的金属回收容器。';
        case '玻璃':
          return '投放到可回收物垃圾桶，或专门的玻璃回收容器。';
        case '有害垃圾':
          return '投放到有害垃圾收集点，不要与其他垃圾混合。';
        case '厨余垃圾':
          return '投放到厨余垃圾桶，便于后续堆肥处理。';
        default:
          return '根据当地垃圾分类规定进行投放。';
      }
    },
    
    // 获取回收利用指南
    getRecyclingGuide() {
      if (!this.result) return '';
      
      switch (this.result.label) {
        case '塑料':
          return '回收后可制成再生塑料制品，如塑料袋、塑料瓶等。';
        case '纸类':
          return '回收后可制成再生纸制品，如纸巾、包装纸等。';
        case '金属':
          return '回收后可熔炼成新的金属制品，节约矿产资源。';
        case '玻璃':
          return '回收后可熔炼成新的玻璃制品，节约能源和原材料。';
        case '有害垃圾':
          return '专业处理后可回收有价值的金属和材料，减少环境污染。';
        case '厨余垃圾':
          return '可用于堆肥，制成有机肥料，促进农业可持续发展。';
        default:
          return '通过专业回收处理，减少资源浪费和环境污染。';
      }
    },
    
    // 格式化距离
    formatDistance(distance) {
      if (distance >= 1000) {
        return (distance / 1000).toFixed(1) + 'km';
      }
      return distance + 'm';
    },
    
    // 查看所有回收站
    viewAllStations() {
      uni.switchTab({
        url: '/pages/recycle-map/map-container'
      });
    },
    
    // 导航到回收站
    navigateToStation(station) {
      uni.navigateTo({
        url: `/pages/recycle-map/navigation?id=${station.id}&lat=${station.latitude || 39.908187}&lng=${station.longitude || 116.394451}&name=${encodeURIComponent(station.name)}`
      });
    },
    
    // 再次扫描
    scanAgain() {
      uni.navigateBack();
    },
    
    // 分享结果
    shareResult() {
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
            content: '分享您的环保成果到社交媒体',
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
    
    // 返回
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style>
.result-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F5F5;
}

.nav-bar {
  height: 44px;
  background-color: #4CAF50;
  display: flex;
  align-items: center;
  padding: 0 15px;
  position: relative;
}

.back-btn {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.back-icon {
  font-size: 20px;
  color: white;
}

.page-title {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.result-content {
  flex: 1;
  padding: 15px;
}

.result-card {
  margin-bottom: 15px;
}

.item-info {
  padding: 5px 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.item-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.item-tag {
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.item-tag.recyclable {
  background-color: #4CAF50;
  color: white;
}

.item-tag.non-recyclable {
  background-color: #F44336;
  color: white;
}

.item-details {
  margin-bottom: 10px;
}

.detail-item {
  margin-bottom: 10px;
}

.detail-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 3px;
  display: block;
}

.detail-value {
  font-size: 16px;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.view-more {
  font-size: 12px;
  color: #4CAF50;
}

.contribution-content {
  display: flex;
  margin-bottom: 20px;
}

.contribution-item {
  flex: 1;
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
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 2px;
}

.contribution-label {
  font-size: 12px;
  color: #666;
}

.progress-section {
  border-top: 1px solid #EFEFEF;
  padding-top: 15px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-title {
  font-size: 14px;
  color: #333;
}

.progress-value {
  font-size: 14px;
  color: #4CAF50;
  font-weight: bold;
}

.progress-bar {
  height: 8px;
  background-color: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 4px;
}

.guide-steps {
  padding: 5px 0;
}

.guide-step {
  display: flex;
  margin-bottom: 15px;
}

.guide-step:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #4CAF50;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  margin-right: 10px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.step-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.station-list {
  padding: 5px 0;
}

.station-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #EFEFEF;
}

.station-item:last-child {
  border-bottom: none;
}

.station-info {
  flex: 1;
  margin-right: 10px;
}

.station-name {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.station-address {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  display: block;
}

.station-tags {
  display: flex;
  flex-wrap: wrap;
}

.station-tag {
  font-size: 12px;
  color: #4CAF50;
  background-color: #E8F5E9;
  padding: 2px 6px;
  border-radius: 10px;
  margin-right: 5px;
  margin-bottom: 5px;
}

.station-distance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.distance-value {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
}

.navigate-text {
  font-size: 12px;
  color: #4CAF50;
  background-color: #E8F5E9;
  padding: 2px 8px;
  border-radius: 10px;
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
  line-height: 44px;
  text-align: center;
  border-radius: 22px;
  font-size: 16px;
  margin: 0 5px;
}

.scan-again-btn {
  background-color: #F5F5F5;
  color: #333;
}

.share-btn {
  background-color: #4CAF50;
  color: white;
}
</style>
