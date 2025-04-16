<template>
  <view class="navigation-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">导航</text>
    </view>
    
    <!-- 地图组件 -->
    <view class="map-wrapper">
      <map
        id="map"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :markers="markers"
        :polyline="polyline"
        :scale="mapScale"
        :show-location="true"
        @markertap="onMarkerTap"
      ></map>
      
      <!-- 定位按钮 -->
      <view class="location-btn" @click="moveToUserLocation">
        <image class="location-icon" src="/static/icons/location.png"></image>
      </view>
      
      <!-- 缩放按钮 -->
      <view class="zoom-controls">
        <view class="zoom-btn zoom-in-btn" @click="zoomIn">
          <text class="zoom-icon">+</text>
        </view>
        <view class="zoom-btn zoom-out-btn" @click="zoomOut">
          <text class="zoom-icon">-</text>
        </view>
      </view>
    </view>
    
    <!-- 导航信息卡片 -->
    <view class="navigation-card">
      <!-- 目的地信息 -->
      <view class="destination-info">
        <view class="destination-icon-container">
          <image class="destination-icon" src="/static/icons/destination.png"></image>
        </view>
        <view class="destination-details">
          <text class="destination-name">{{ stationName }}</text>
          <text class="destination-distance">{{ formatDistance(distance) }}</text>
        </view>
      </view>
      
      <!-- 导航指示 -->
      <view class="navigation-instruction">
        <view class="instruction-icon-container">
          <image class="instruction-icon" :src="getInstructionIcon()"></image>
        </view>
        <view class="instruction-details">
          <text class="instruction-text">{{ currentInstruction.text }}</text>
          <text class="instruction-distance">{{ formatDistance(currentInstruction.distance) }}</text>
        </view>
      </view>
      
      <!-- 导航进度 -->
      <view class="navigation-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercentage + '%' }"></view>
        </view>
        <view class="progress-info">
          <text class="progress-text">预计到达时间: {{ estimatedArrivalTime }}</text>
        </view>
      </view>
      
      <!-- 导航操作 -->
      <view class="navigation-actions">
        <button class="action-btn" @click="toggleNavigationMode">
          <image class="btn-icon" :src="isNavigating ? '/static/icons/pause.png' : '/static/icons/play.png'"></image>
          <text class="btn-text">{{ isNavigating ? '暂停导航' : '开始导航' }}</text>
        </button>
        
        <button class="action-btn" @click="openExternalNavigation">
          <image class="btn-icon" src="/static/icons/external-nav.png"></image>
          <text class="btn-text">使用高德导航</text>
        </button>
      </view>
    </view>
    
    <!-- 导航完成弹窗 -->
    <view class="completion-popup" v-if="showCompletionPopup">
      <view class="completion-content">
        <image class="completion-icon" src="/static/icons/success.png"></image>
        <text class="completion-title">到达目的地</text>
        <text class="completion-text">您已到达回收站，感谢您的环保行动！</text>
        
        <view class="completion-actions">
          <button class="completion-btn" @click="closeCompletionPopup">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import mapService from '../../services/map-service.js';

export default {
  data() {
    return {
      // 地图相关
      mapCenter: {
        latitude: 39.908187,
        longitude: 116.394451
      },
      mapScale: 16,
      markers: [],
      polyline: [],
      
      // 导航相关
      stationId: '',
      stationName: '',
      stationLocation: null,
      userLocation: null,
      distance: 0,
      duration: 0,
      isNavigating: false,
      navigationTimer: null,
      
      // 导航指示
      navigationInstructions: [],
      currentInstructionIndex: 0,
      
      // UI状态
      showCompletionPopup: false,
      
      // 模拟导航数据
      simulationSpeed: 1, // 模拟速度倍数
      simulationInterval: null,
      simulationPath: [],
      simulationIndex: 0
    };
  },
  computed: {
    // 当前导航指示
    currentInstruction() {
      if (this.navigationInstructions.length === 0) {
        return {
          text: '正在获取导航信息...',
          distance: 0
        };
      }
      
      return this.navigationInstructions[this.currentInstructionIndex];
    },
    
    // 导航进度百分比
    progressPercentage() {
      if (this.distance === 0) return 0;
      
      // 计算已走过的距离
      const totalDistance = this.getTotalDistance();
      const remainingDistance = this.distance;
      const traveledDistance = totalDistance - remainingDistance;
      
      // 计算进度百分比
      return Math.min(Math.max((traveledDistance / totalDistance) * 100, 0), 100);
    },
    
    // 预计到达时间
    estimatedArrivalTime() {
      if (this.duration === 0) return '计算中...';
      
      // 计算预计到达时间
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + this.duration * 1000);
      
      // 格式化时间
      const hours = arrivalTime.getHours().toString().padStart(2, '0');
      const minutes = arrivalTime.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    }
  },
  onLoad(options) {
    // 获取回收站ID
    if (options.id) {
      this.stationId = options.id;
    }
    
    // 获取回收站名称
    if (options.name) {
      this.stationName = decodeURIComponent(options.name);
    }
    
    // 获取回收站位置
    if (options.lat && options.lng) {
      this.stationLocation = {
        latitude: parseFloat(options.lat),
        longitude: parseFloat(options.lng)
      };
      
      // 设置地图中心为回收站位置
      this.mapCenter = this.stationLocation;
    }
    
    // 初始化导航
    this.initNavigation();
  },
  onUnload() {
    // 清除定时器
    this.clearNavigationTimer();
    this.clearSimulationInterval();
  },
  methods: {
    // 初始化导航
    async initNavigation() {
      try {
        // 初始化地图服务
        if (!mapService.isInitialized) {
          await mapService.init();
        }
        
        // 获取用户位置
        await this.getUserLocation();
        
        // 如果没有回收站位置，获取回收站详情
        if (!this.stationLocation) {
          await this.getStationDetail();
        }
        
        // 更新地图标记
        this.updateMapMarkers();
        
        // 获取导航路线
        await this.getNavigationRoute();
      } catch (error) {
        console.error('Failed to initialize navigation:', error);
        
        uni.showToast({
          title: '初始化导航失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 获取用户位置
    async getUserLocation() {
      try {
        // 获取用户位置
        const location = await mapService.getUserLocation();
        
        this.userLocation = location;
        
        console.log('User location:', location);
      } catch (error) {
        console.error('Failed to get user location:', error);
        
        uni.showModal({
          title: '位置获取失败',
          content: '无法获取您的位置，请检查定位权限设置',
          showCancel: false
        });
      }
    },
    
    // 获取回收站详情
    async getStationDetail() {
      try {
        // 获取回收站详情
        const station = await mapService.getStationDetail(this.stationId);
        
        if (station) {
          this.stationName = station.name;
          this.stationLocation = {
            latitude: station.latitude,
            longitude: station.longitude
          };
          
          // 设置地图中心为回收站位置
          this.mapCenter = this.stationLocation;
        } else {
          throw new Error('Station not found');
        }
      } catch (error) {
        console.error('Failed to get station detail:', error);
        
        uni.showToast({
          title: '获取回收站信息失败',
          icon: 'none'
        });
      }
    },
    
    // 更新地图标记
    updateMapMarkers() {
      const markers = [];
      
      // 添加回收站标记
      if (this.stationLocation) {
        markers.push({
          id: 0,
          latitude: this.stationLocation.latitude,
          longitude: this.stationLocation.longitude,
          title: this.stationName,
          iconPath: '/static/icons/recycle-marker.png',
          width: 32,
          height: 32,
          callout: {
            content: this.stationName,
            color: '#333333',
            fontSize: 14,
            borderRadius: 5,
            padding: 10,
            display: 'BYCLICK'
          }
        });
      }
      
      // 添加用户位置标记
      if (this.userLocation) {
        markers.push({
          id: 1,
          latitude: this.userLocation.latitude,
          longitude: this.userLocation.longitude,
          title: '我的位置',
          iconPath: '/static/icons/user-location.png',
          width: 32,
          height: 32,
          zIndex: 100
        });
      }
      
      this.markers = markers;
    },
    
    // 获取导航路线
    async getNavigationRoute() {
      try {
        // 检查用户位置和回收站位置
        if (!this.userLocation || !this.stationLocation) {
          throw new Error('Missing location information');
        }
        
        // 在实际应用中，这里会调用高德地图API获取导航路线
        // 这里使用模拟数据
        await this.getMockNavigationRoute();
      } catch (error) {
        console.error('Failed to get navigation route:', error);
        
        uni.showToast({
          title: '获取导航路线失败',
          icon: 'none'
        });
      }
    },
    
    // 获取模拟导航路线
    async getMockNavigationRoute() {
      // 生成模拟路径点
      this.simulationPath = this.generateSimulationPath();
      
      // 设置路线
      this.polyline = [{
        points: this.simulationPath,
        color: '#4CAF50',
        width: 6,
        arrowLine: true
      }];
      
      // 计算距离和时间
      this.distance = this.calculatePathDistance(this.simulationPath);
      this.duration = this.distance / 80; // 假设步行速度为80米/分钟
      
      // 生成导航指示
      this.navigationInstructions = this.generateNavigationInstructions();
      
      console.log('Navigation route generated:', {
        distance: this.distance,
        duration: this.duration,
        instructions: this.navigationInstructions
      });
    },
    
    // 生成模拟路径点
    generateSimulationPath() {
      // 如果没有用户位置或回收站位置，返回空数组
      if (!this.userLocation || !this.stationLocation) {
        return [];
      }
      
      // 起点和终点
      const start = {
        latitude: this.userLocation.latitude,
        longitude: this.userLocation.longitude
      };
      
      const end = {
        latitude: this.stationLocation.latitude,
        longitude: this.stationLocation.longitude
      };
      
      // 计算中间点数量（根据距离）
      const distance = mapService.calculateDistance(
        start.latitude, start.longitude,
        end.latitude, end.longitude
      );
      
      const pointCount = Math.max(Math.floor(distance / 50), 5); // 每50米一个点，至少5个点
      
      // 生成路径点
      const path = [start];
      
      for (let i = 1; i < pointCount; i++) {
        const ratio = i / pointCount;
        
        // 添加一些随机偏移，模拟真实路径
        const randomLat = (Math.random() - 0.5) * 0.0005;
        const randomLng = (Math.random() - 0.5) * 0.0005;
        
        const point = {
          latitude: start.latitude + (end.latitude - start.latitude) * ratio + randomLat,
          longitude: start.longitude + (end.longitude - start.longitude) * ratio + randomLng
        };
        
        path.push(point);
      }
      
      path.push(end);
      
      return path;
    },
    
    // 计算路径距离
    calculatePathDistance(path) {
      let distance = 0;
      
      for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1];
        const curr = path[i];
        
        distance += mapService.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
      }
      
      return distance;
    },
    
    // 生成导航指示
    generateNavigationInstructions() {
      // 模拟导航指示
      const instructions = [
        {
          text: '沿当前道路向前走',
          distance: this.distance * 0.3,
          icon: 'straight'
        },
        {
          text: '左转进入环保路',
          distance: this.distance * 0.2,
          icon: 'left'
        },
        {
          text: '沿环保路继续前行',
          distance: this.distance * 0.3,
          icon: 'straight'
        },
        {
          text: '右转进入回收站',
          distance: this.distance * 0.2,
          icon: 'right'
        },
        {
          text: '到达目的地',
          distance: 0,
          icon: 'destination'
        }
      ];
      
      return instructions;
    },
    
    // 开始/暂停导航
    toggleNavigationMode() {
      if (this.isNavigating) {
        // 暂停导航
        this.pauseNavigation();
      } else {
        // 开始导航
        this.startNavigation();
      }
    },
    
    // 开始导航
    startNavigation() {
      this.isNavigating = true;
      
      // 开始模拟导航
      this.startSimulation();
      
      // 设置导航定时器，定期更新位置和指示
      this.navigationTimer = setInterval(() => {
        this.updateNavigation();
      }, 5000);
      
      uni.showToast({
        title: '导航开始',
        icon: 'success'
      });
    },
    
    // 暂停导航
    pauseNavigation() {
      this.isNavigating = false;
      
      // 清除定时器
      this.clearNavigationTimer();
      
      // 暂停模拟
      this.pauseSimulation();
      
      uni.showToast({
        title: '导航暂停',
        icon: 'none'
      });
    },
    
    // 更新导航
    updateNavigation() {
      // 获取用户位置
      this.getUserLocation();
      
      // 更新地图标记
      this.updateMapMarkers();
      
      // 检查是否到达目的地
      this.checkArrival();
    },
    
    // 检查是否到达目的地
    checkArrival() {
      // 如果没有用户位置或回收站位置，返回
      if (!this.userLocation || !this.stationLocation) {
        return;
      }
      
      // 计算用户与目的地的距离
      const distance = mapService.calculateDistance(
        this.userLocation.latitude, this.userLocation.longitude,
        this.stationLocation.latitude, this.stationLocation.longitude
      );
      
      // 如果距离小于50米，认为已到达
      if (distance < 50) {
        // 停止导航
        this.pauseNavigation();
        
        // 显示到达提示
        this.showCompletionPopup = true;
      }
    },
    
    // 关闭到达提示
    closeCompletionPopup() {
      this.showCompletionPopup = false;
      
      // 返回上一页
      uni.navigateBack();
    },
    
    // 清除导航定时器
    clearNavigationTimer() {
      if (this.navigationTimer) {
        clearInterval(this.navigationTimer);
        this.navigationTimer = null;
      }
    },
    
    // 开始模拟导航
    startSimulation() {
      // 如果没有路径点，返回
      if (this.simulationPath.length === 0) {
        return;
      }
      
      // 设置模拟间隔，定期更新用户位置
      this.simulationInterval = setInterval(() => {
        this.updateSimulation();
      }, 1000);
    },
    
    // 暂停模拟导航
    pauseSimulation() {
      this.clearSimulationInterval();
    },
    
    // 更新模拟
    updateSimulation() {
      // 如果已经到达终点，停止模拟
      if (this.simulationIndex >= this.simulationPath.length - 1) {
        this.clearSimulationInterval();
        return;
      }
      
      // 更新模拟索引
      this.simulationIndex += this.simulationSpeed;
      
      // 确保索引不超出范围
      this.simulationIndex = Math.min(this.simulationIndex, this.simulationPath.length - 1);
      
      // 获取当前位置
      const currentPoint = this.simulationPath[Math.floor(this.simulationIndex)];
      
      // 更新用户位置
      this.userLocation = {
        latitude: currentPoint.latitude,
        longitude: currentPoint.longitude
      };
      
      // 更新地图中心
      this.mapCenter = this.userLocation;
      
      // 更新地图标记
      this.updateMapMarkers();
      
      // 更新距离
      this.updateDistance();
      
      // 更新导航指示
      this.updateNavigationInstruction();
      
      // 检查是否到达目的地
      this.checkArrival();
    },
    
    // 清除模拟间隔
    clearSimulationInterval() {
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
    },
    
    // 更新距离
    updateDistance() {
      // 如果没有用户位置或回收站位置，返回
      if (!this.userLocation || !this.stationLocation) {
        return;
      }
      
      // 计算用户与目的地的距离
      this.distance = mapService.calculateDistance(
        this.userLocation.latitude, this.userLocation.longitude,
        this.stationLocation.latitude, this.stationLocation.longitude
      );
      
      // 更新预计到达时间
      this.duration = this.distance / 80; // 假设步行速度为80米/分钟
    },
    
    // 更新导航指示
    updateNavigationInstruction() {
      // 如果没有导航指示，返回
      if (this.navigationInstructions.length === 0) {
        return;
      }
      
      // 计算当前应该显示的指示
      let totalDistance = 0;
      let index = 0;
      
      for (let i = 0; i < this.navigationInstructions.length; i++) {
        totalDistance += this.navigationInstructions[i].distance;
        
        if (totalDistance > this.distance) {
          index = i;
          break;
        }
      }
      
      // 更新当前指示索引
      this.currentInstructionIndex = index;
    },
    
    // 获取导航指示图标
    getInstructionIcon() {
      const iconType = this.currentInstruction.icon || 'straight';
      
      const iconMap = {
        'straight': '/static/icons/nav-straight.png',
        'left': '/static/icons/nav-left.png',
        'right': '/static/icons/nav-right.png',
        'destination': '/static/icons/nav-destination.png'
      };
      
      return iconMap[iconType] || iconMap.straight;
    },
    
    // 使用外部导航
    openExternalNavigation() {
      try {
        // 打开高德地图导航
        mapService.openNavigation({
          latitude: this.stationLocation.latitude,
          longitude: this.stationLocation.longitude,
          name: this.stationName
        });
      } catch (error) {
        console.error('Failed to open external navigation:', error);
        
        uni.showToast({
          title: '打开导航失败',
          icon: 'none'
        });
      }
    },
    
    // 标记点击事件
    onMarkerTap(e) {
      const markerId = e.detail.markerId;
      
      console.log('Marker tapped:', markerId);
    },
    
    // 移动到用户位置
    moveToUserLocation() {
      if (this.userLocation) {
        this.mapCenter = this.userLocation;
      } else {
        this.getUserLocation();
      }
    },
    
    // 放大地图
    zoomIn() {
      if (this.mapScale < 20) {
        this.mapScale += 1;
      }
    },
    
    // 缩小地图
    zoomOut() {
      if (this.mapScale > 5) {
        this.mapScale -= 1;
      }
    },
    
    // 获取总距离
    getTotalDistance() {
      // 计算导航指示中的总距离
      let totalDistance = 0;
      
      for (const instruction of this.navigationInstructions) {
        totalDistance += instruction.distance;
      }
      
      return totalDistance || this.distance;
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
.navigation-container {
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

.map-wrapper {
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.location-btn {
  position: absolute;
  bottom: 100px;
  right: 15px;
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.location-icon {
  width: 20px;
  height: 20px;
}

.zoom-controls {
  position: absolute;
  bottom: 150px;
  right: 15px;
  display: flex;
  flex-direction: column;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.zoom-in-btn {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  border-bottom: 1px solid #EEEEEE;
}

.zoom-out-btn {
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.zoom-icon {
  font-size: 20px;
  color: #333;
}

.navigation-card {
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.destination-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.destination-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #E8F5E9;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
}

.destination-icon {
  width: 24px;
  height: 24px;
}

.destination-details {
  flex: 1;
}

.destination-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

.destination-distance {
  font-size: 14px;
  color: #666;
}

.navigation-instruction {
  display: flex;
  align-items: center;
  background-color: #F5F5F5;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.instruction-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
}

.instruction-icon {
  width: 24px;
  height: 24px;
}

.instruction-details {
  flex: 1;
}

.instruction-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

.instruction-distance {
  font-size: 14px;
  color: #666;
}

.navigation-progress {
  margin-bottom: 15px;
}

.progress-bar {
  height: 6px;
  background-color: #E0E0E0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 3px;
}

.progress-info {
  display: flex;
  justify-content: center;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.navigation-actions {
  display: flex;
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

.action-btn:first-child {
  background-color: #4CAF50;
  color: white;
}

.action-btn:last-child {
  background-color: #F5F5F5;
  color: #333;
}

.btn-icon {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}

.btn-text {
  font-size: 14px;
}

.completion-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.completion-content {
  width: 80%;
  max-width: 300px;
  background-color: white;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.completion-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 15px;
}

.completion-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.completion-text {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
}

.completion-actions {
  width: 100%;
}

.completion-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  text-align: center;
  background-color: #4CAF50;
  color: white;
  border-radius: 22px;
  font-size: 16px;
}
</style>
