<template>
  <view class="station-detail-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">回收站详情</text>
      <view class="share-btn" @click="shareStation">
        <image class="share-icon" src="/static/icons/share.png"></image>
      </view>
    </view>
    
    <!-- 回收站信息 -->
    <scroll-view class="content-scroll" scroll-y="true">
      <!-- 回收站图片 -->
      <swiper 
        class="station-images" 
        indicator-dots="true" 
        autoplay="true" 
        interval="5000" 
        duration="500"
      >
        <swiper-item v-for="(image, index) in stationData.images" :key="index">
          <image class="station-image" :src="image" mode="aspectFill"></image>
        </swiper-item>
      </swiper>
      
      <!-- 回收站基本信息 -->
      <view class="station-info-card">
        <view class="station-header">
          <text class="station-name">{{ stationData.name }}</text>
          <view class="station-rating">
            <text class="rating-value">{{ stationData.rating }}</text>
            <text class="rating-icon">★</text>
          </view>
        </view>
        
        <view class="station-tags">
          <view class="station-tag" v-for="(tag, index) in stationData.tags" :key="index">{{ tag }}</view>
        </view>
        
        <view class="info-section">
          <view class="info-row">
            <image class="info-icon" src="/static/icons/location-pin.png"></image>
            <text class="info-text">{{ stationData.address }}</text>
          </view>
          
          <view class="info-row">
            <image class="info-icon" src="/static/icons/clock.png"></image>
            <text class="info-text">{{ stationData.openTime || '营业时间未知' }}</text>
          </view>
          
          <view class="info-row">
            <image class="info-icon" src="/static/icons/phone.png"></image>
            <text class="info-text">{{ stationData.contact || '联系方式未知' }}</text>
            <view class="call-btn" @click="callStation">
              <text class="call-text">拨打</text>
            </view>
          </view>
          
          <view class="info-row">
            <image class="info-icon" src="/static/icons/distance.png"></image>
            <text class="info-text">距离您 {{ formatDistance(stationData.distance) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 回收类型 -->
      <view class="recycle-types-card">
        <view class="card-title">回收类型</view>
        
        <view class="recycle-types-grid">
          <view 
            v-for="(type, index) in stationData.recycleTypes" 
            :key="index" 
            class="recycle-type-item"
          >
            <image class="type-icon" :src="getTypeIcon(type)"></image>
            <text class="type-name">{{ type }}</text>
          </view>
        </view>
      </view>
      
      <!-- 回收站描述 -->
      <view class="description-card" v-if="stationData.description">
        <view class="card-title">回收站介绍</view>
        <text class="description-text">{{ stationData.description }}</text>
      </view>
      
      <!-- 用户评价 -->
      <view class="comments-card" v-if="stationData.comments && stationData.comments.length > 0">
        <view class="card-title">用户评价</view>
        
        <view 
          v-for="(comment, index) in stationData.comments" 
          :key="index" 
          class="comment-item"
        >
          <view class="comment-header">
            <text class="comment-user">{{ comment.user }}</text>
            <text class="comment-time">{{ comment.time }}</text>
          </view>
          <text class="comment-content">{{ comment.content }}</text>
        </view>
        
        <view class="more-comments" @click="viewMoreComments" v-if="stationData.comments.length > 2">
          <text class="more-text">查看更多评价</text>
        </view>
      </view>
      
      <!-- 附近其他回收站 -->
      <view class="nearby-stations-card">
        <view class="card-title">附近其他回收站</view>
        
        <view 
          v-for="(station, index) in nearbyStations" 
          :key="station.id" 
          class="nearby-station-item"
          @click="viewStationDetail(station)"
        >
          <view class="station-info">
            <text class="station-name">{{ station.name }}</text>
            <text class="station-address">{{ station.address }}</text>
            <view class="station-tags">
              <view class="station-tag" v-for="(tag, tagIndex) in station.tags" :key="tagIndex">{{ tag }}</view>
            </view>
          </view>
          <view class="station-distance">
            <text class="distance-value">{{ formatDistance(station.distance) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <button class="action-btn collect-btn" @click="collectStation">
        <image class="btn-icon" :src="isCollected ? '/static/icons/star-filled.png' : '/static/icons/star.png'"></image>
        <text class="btn-text">{{ isCollected ? '已收藏' : '收藏' }}</text>
      </button>
      
      <button class="action-btn navigate-btn" @click="navigateToStation">
        <image class="btn-icon" src="/static/icons/navigation.png"></image>
        <text class="btn-text">导航</text>
      </button>
    </view>
  </view>
</template>

<script>
import mapService from '../../services/map-service.js';

export default {
  data() {
    return {
      stationId: '',
      stationData: {
        id: '',
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        distance: 0,
        tags: [],
        recycleTypes: [],
        openTime: '',
        contact: '',
        description: '',
        images: [],
        rating: 0,
        comments: []
      },
      nearbyStations: [],
      isCollected: false
    };
  },
  onLoad(options) {
    // 获取回收站ID
    if (options.id) {
      this.stationId = options.id;
      
      // 加载回收站详情
      this.loadStationDetail();
    }
  },
  methods: {
    // 加载回收站详情
    async loadStationDetail() {
      try {
        // 显示加载提示
        uni.showLoading({
          title: '加载中...'
        });
        
        // 初始化地图服务
        if (!mapService.isInitialized) {
          await mapService.init();
        }
        
        // 获取回收站详情
        const station = await mapService.getStationDetail(this.stationId);
        
        if (station) {
          this.stationData = station;
          
          // 检查是否已收藏
          this.checkIfCollected();
          
          // 加载附近其他回收站
          this.loadNearbyStations();
        } else {
          throw new Error('Station not found');
        }
        
        // 隐藏加载提示
        uni.hideLoading();
      } catch (error) {
        console.error('Failed to load station detail:', error);
        uni.hideLoading();
        
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 加载附近其他回收站
    async loadNearbyStations() {
      try {
        // 搜索选项
        const options = {
          latitude: this.stationData.latitude,
          longitude: this.stationData.longitude,
          radius: 2000,
          keywords: ''
        };
        
        // 搜索附近回收站
        const stations = await mapService.searchNearbyStations(options);
        
        // 过滤掉当前回收站
        this.nearbyStations = stations.filter(station => station.id !== this.stationId);
        
        // 最多显示3个
        this.nearbyStations = this.nearbyStations.slice(0, 3);
      } catch (error) {
        console.error('Failed to load nearby stations:', error);
      }
    },
    
    // 检查是否已收藏
    checkIfCollected() {
      try {
        // 获取收藏的回收站
        const collectedStations = uni.getStorageSync('collectedStations') || [];
        
        // 检查当前回收站是否在收藏列表中
        this.isCollected = collectedStations.some(id => id === this.stationId);
      } catch (error) {
        console.error('Failed to check if station is collected:', error);
      }
    },
    
    // 收藏/取消收藏回收站
    collectStation() {
      try {
        // 获取收藏的回收站
        let collectedStations = uni.getStorageSync('collectedStations') || [];
        
        if (this.isCollected) {
          // 取消收藏
          collectedStations = collectedStations.filter(id => id !== this.stationId);
          
          uni.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
        } else {
          // 添加收藏
          collectedStations.push(this.stationId);
          
          uni.showToast({
            title: '收藏成功',
            icon: 'success'
          });
        }
        
        // 保存收藏的回收站
        uni.setStorageSync('collectedStations', collectedStations);
        
        // 更新收藏状态
        this.isCollected = !this.isCollected;
      } catch (error) {
        console.error('Failed to collect station:', error);
        
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 导航到回收站
    navigateToStation() {
      try {
        // 跳转到导航页面
        uni.navigateTo({
          url: `/pages/recycle-map/navigation?id=${this.stationData.id}&lat=${this.stationData.latitude}&lng=${this.stationData.longitude}&name=${encodeURIComponent(this.stationData.name)}`
        });
      } catch (error) {
        console.error('Failed to navigate to station:', error);
        
        uni.showToast({
          title: '导航失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 拨打回收站电话
    callStation() {
      if (!this.stationData.contact) {
        uni.showToast({
          title: '暂无联系方式',
          icon: 'none'
        });
        return;
      }
      
      uni.makePhoneCall({
        phoneNumber: this.stationData.contact,
        success: () => {
          console.log('Phone call success');
        },
        fail: (err) => {
          console.error('Phone call failed:', err);
        }
      });
    },
    
    // 查看更多评价
    viewMoreComments() {
      // 在实际应用中，这里会跳转到评价列表页面
      uni.showToast({
        title: '查看更多评价功能即将上线',
        icon: 'none'
      });
    },
    
    // 查看其他回收站详情
    viewStationDetail(station) {
      uni.navigateTo({
        url: `/pages/recycle-map/station-detail?id=${station.id}`
      });
    },
    
    // 分享回收站
    shareStation() {
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
            content: '分享此回收站给好友',
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
    
    // 获取回收类型图标
    getTypeIcon(type) {
      const iconMap = {
        '塑料': '/static/icons/plastic.png',
        '纸类': '/static/icons/paper.png',
        '金属': '/static/icons/metal.png',
        '玻璃': '/static/icons/glass.png',
        '电子垃圾': '/static/icons/electronic.png',
        '有害垃圾': '/static/icons/hazardous.png'
      };
      
      return iconMap[type] || '/static/icons/recycle.png';
    },
    
    // 格式化距离
    formatDistance(distance) {
      if (distance >= 1000) {
        return (distance / 1000).toFixed(1) + 'km';
      }
      return distance + 'm';
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style>
.station-detail-container {
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
  position: relative;
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
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.content-scroll {
  flex: 1;
}

.station-images {
  width: 100%;
  height: 200px;
}

.station-image {
  width: 100%;
  height: 100%;
}

.station-info-card {
  background-color: white;
  padding: 15px;
  margin: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.station-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.station-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.station-rating {
  display: flex;
  align-items: center;
}

.rating-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-right: 5px;
}

.rating-icon {
  font-size: 16px;
  color: #FFC107;
}

.station-tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;
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

.info-section {
  border-top: 1px solid #EEEEEE;
  padding-top: 15px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-icon {
  width: 16px;
  height: 16px;
  margin-right: 10px;
}

.info-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.call-btn {
  background-color: #4CAF50;
  padding: 5px 10px;
  border-radius: 15px;
}

.call-text {
  font-size: 12px;
  color: white;
}

.recycle-types-card, .description-card, .comments-card, .nearby-stations-card {
  background-color: white;
  padding: 15px;
  margin: 0 15px 15px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.recycle-types-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -5px;
}

.recycle-type-item {
  width: 25%;
  padding: 0 5px;
  margin-bottom: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.type-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 5px;
}

.type-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.description-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.comment-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #EEEEEE;
}

.comment-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.comment-user {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.more-comments {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.more-text {
  font-size: 14px;
  color: #4CAF50;
}

.nearby-station-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #EEEEEE;
}

.nearby-station-item:last-child {
  border-bottom: none;
}

.station-info {
  flex: 1;
  margin-right: 10px;
}

.station-address {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  display: block;
}

.station-distance {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.distance-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
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

.collect-btn {
  background-color: #F5F5F5;
  color: #333;
}

.navigate-btn {
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
</style>
