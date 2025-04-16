<template>
  <view class="map-container">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-input-container">
        <image class="search-icon" src="/static/icons/search.png"></image>
        <input 
          class="search-input" 
          type="text" 
          placeholder="搜索回收站" 
          v-model="searchKeyword"
          @confirm="searchStations"
        />
        <view class="clear-btn" v-if="searchKeyword" @click="clearSearch">
          <text class="clear-icon">×</text>
        </view>
      </view>
      <view class="filter-btn" @click="showFilterOptions">
        <image class="filter-icon" src="/static/icons/filter.png"></image>
      </view>
    </view>
    
    <!-- 地图组件 -->
    <view class="map-wrapper">
      <map
        id="map"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :markers="markers"
        :scale="mapScale"
        :show-location="true"
        @markertap="onMarkerTap"
        @callouttap="onCalloutTap"
        @regionchange="onMapRegionChange"
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
    
    <!-- 回收站列表 -->
    <view class="station-list" :class="{ 'expanded': showStationList }">
      <!-- 列表头部 -->
      <view class="list-header" @click="toggleStationList">
        <text class="list-title">附近回收站</text>
        <view class="list-count">{{ stations.length }}个</view>
        <view class="toggle-btn">
          <text class="toggle-icon">{{ showStationList ? '↓' : '↑' }}</text>
        </view>
      </view>
      
      <!-- 列表内容 -->
      <scroll-view 
        class="list-content" 
        scroll-y="true"
        v-if="showStationList"
      >
        <view 
          v-for="(station, index) in stations" 
          :key="station.id" 
          class="station-item"
          :class="{ 'active': selectedStationId === station.id }"
          @click="selectStation(station)"
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
            <view class="navigate-btn" @click.stop="navigateToStation(station)">
              <text class="navigate-text">导航</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="stations.length === 0 && !isLoading">
          <image class="empty-image" src="/static/images/empty-location.png"></image>
          <text class="empty-text">附近暂无回收站</text>
          <text class="empty-subtext">尝试扩大搜索范围或更换位置</text>
        </view>
        
        <!-- 加载状态 -->
        <view class="loading-state" v-if="isLoading">
          <eco-loading text="搜索中..."></eco-loading>
        </view>
      </scroll-view>
    </view>
    
    <!-- 回收站详情卡片 -->
    <view class="station-detail-card" v-if="selectedStation && !showStationList">
      <view class="card-header">
        <text class="station-name">{{ selectedStation.name }}</text>
        <view class="close-btn" @click="closeStationDetail">
          <text class="close-icon">×</text>
        </view>
      </view>
      
      <view class="card-content">
        <view class="detail-row">
          <image class="detail-icon" src="/static/icons/location-pin.png"></image>
          <text class="detail-text">{{ selectedStation.address }}</text>
        </view>
        
        <view class="detail-row">
          <image class="detail-icon" src="/static/icons/clock.png"></image>
          <text class="detail-text">{{ selectedStation.openTime || '营业时间未知' }}</text>
        </view>
        
        <view class="detail-row">
          <image class="detail-icon" src="/static/icons/phone.png"></image>
          <text class="detail-text">{{ selectedStation.contact || '联系方式未知' }}</text>
        </view>
        
        <view class="detail-row">
          <image class="detail-icon" src="/static/icons/recycle.png"></image>
          <view class="recycle-types">
            <view 
              v-for="(type, index) in selectedStation.recycleTypes" 
              :key="index" 
              class="recycle-type"
            >
              {{ type }}
            </view>
          </view>
        </view>
      </view>
      
      <view class="card-actions">
        <button class="action-btn detail-btn" @click="viewStationDetail(selectedStation)">
          <image class="btn-icon" src="/static/icons/info.png"></image>
          <text class="btn-text">详情</text>
        </button>
        
        <button class="action-btn navigate-btn" @click="navigateToStation(selectedStation)">
          <image class="btn-icon" src="/static/icons/navigation.png"></image>
          <text class="btn-text">导航</text>
        </button>
      </view>
    </view>
    
    <!-- 筛选选项弹窗 -->
    <view class="filter-popup" v-if="showFilter">
      <view class="filter-overlay" @click="hideFilterOptions"></view>
      <view class="filter-content">
        <view class="filter-header">
          <text class="filter-title">筛选回收站</text>
          <text class="filter-close" @click="hideFilterOptions">×</text>
        </view>
        
        <!-- 搜索半径 -->
        <view class="filter-section">
          <text class="section-title">搜索半径</text>
          <view class="radius-slider">
            <slider 
              :min="1000" 
              :max="10000" 
              :step="1000" 
              :value="searchRadius" 
              @change="onRadiusChange" 
              show-value
              :block-size="20"
              activeColor="#4CAF50"
            />
            <view class="radius-labels">
              <text class="radius-min">1km</text>
              <text class="radius-max">10km</text>
            </view>
          </view>
        </view>
        
        <!-- 回收类型 -->
        <view class="filter-section">
          <text class="section-title">回收类型</text>
          <view class="type-options">
            <view 
              v-for="(type, index) in recycleTypes" 
              :key="index" 
              class="type-option"
              :class="{ 'selected': selectedTypes.includes(type) }"
              @click="toggleRecycleType(type)"
            >
              <text class="type-text">{{ type }}</text>
            </view>
          </view>
        </view>
        
        <!-- 其他选项 -->
        <view class="filter-section">
          <text class="section-title">其他选项</text>
          <view class="other-options">
            <view 
              v-for="(option, index) in otherOptions" 
              :key="index" 
              class="other-option"
              :class="{ 'selected': selectedOptions.includes(option.value) }"
              @click="toggleOtherOption(option.value)"
            >
              <text class="option-text">{{ option.label }}</text>
            </view>
          </view>
        </view>
        
        <!-- 筛选按钮 -->
        <view class="filter-actions">
          <button class="filter-btn reset-btn" @click="resetFilters">重置</button>
          <button class="filter-btn apply-btn" @click="applyFilters">应用</button>
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
      mapScale: 14,
      markers: [],
      
      // 用户位置
      userLocation: null,
      
      // 回收站数据
      stations: [],
      selectedStation: null,
      selectedStationId: '',
      
      // UI状态
      isLoading: false,
      showStationList: true,
      showFilter: false,
      
      // 搜索相关
      searchKeyword: '',
      searchRadius: 5000,
      
      // 筛选相关
      recycleTypes: ['塑料', '纸类', '金属', '玻璃', '电子垃圾', '有害垃圾'],
      selectedTypes: [],
      otherOptions: [
        { label: '24小时营业', value: '24hours' },
        { label: '有补贴', value: 'subsidy' }
      ],
      selectedOptions: []
    };
  },
  onLoad() {
    // 初始化地图服务
    this.initMapService();
  },
  methods: {
    // 初始化地图服务
    async initMapService() {
      try {
        this.isLoading = true;
        
        // 初始化地图服务
        await mapService.init();
        
        // 获取用户位置
        await this.getUserLocation();
        
        // 搜索附近回收站
        await this.searchNearbyStations();
        
        this.isLoading = false;
      } catch (error) {
        console.error('Failed to initialize map service:', error);
        this.isLoading = false;
        
        uni.showToast({
          title: '初始化失败，请重试',
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
        this.mapCenter = location;
        
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
    
    // 搜索附近回收站
    async searchNearbyStations() {
      try {
        this.isLoading = true;
        
        // 搜索选项
        const options = {
          latitude: this.mapCenter.latitude,
          longitude: this.mapCenter.longitude,
          radius: this.searchRadius,
          keywords: this.searchKeyword
        };
        
        // 搜索附近回收站
        const stations = await mapService.searchNearbyStations(options);
        
        // 过滤回收站
        this.stations = this.filterStations(stations);
        
        // 更新地图标记
        this.updateMapMarkers();
        
        this.isLoading = false;
      } catch (error) {
        console.error('Failed to search nearby stations:', error);
        this.isLoading = false;
        
        uni.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 过滤回收站
    filterStations(stations) {
      // 如果没有筛选条件，返回所有站点
      if (this.selectedTypes.length === 0 && this.selectedOptions.length === 0) {
        return stations;
      }
      
      return stations.filter(station => {
        // 筛选回收类型
        if (this.selectedTypes.length > 0) {
          // 检查站点是否支持所有选中的回收类型
          const hasAllTypes = this.selectedTypes.every(type => 
            station.recycleTypes && station.recycleTypes.includes(type)
          );
          
          if (!hasAllTypes) return false;
        }
        
        // 筛选其他选项
        if (this.selectedOptions.length > 0) {
          for (const option of this.selectedOptions) {
            if (option === '24hours') {
              // 检查是否24小时营业
              if (!station.tags || !station.tags.includes('24小时')) {
                return false;
              }
            } else if (option === 'subsidy') {
              // 检查是否有补贴
              if (!station.tags || !station.tags.includes('有补贴')) {
                return false;
              }
            }
          }
        }
        
        return true;
      });
    },
    
    // 更新地图标记
    updateMapMarkers() {
      const markers = this.stations.map((station, index) => {
        return {
          id: index,
          latitude: station.latitude,
          longitude: station.longitude,
          title: station.name,
          iconPath: '/static/icons/recycle-marker.png',
          width: 32,
          height: 32,
          callout: {
            content: station.name,
            color: '#333333',
            fontSize: 14,
            borderRadius: 5,
            padding: 10,
            display: 'BYCLICK'
          }
        };
      });
      
      // 添加用户位置标记
      if (this.userLocation) {
        markers.push({
          id: markers.length,
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
    
    // 标记点击事件
    onMarkerTap(e) {
      const markerId = e.detail.markerId;
      
      // 如果点击的是用户位置标记，不做处理
      if (markerId === this.markers.length - 1) {
        return;
      }
      
      // 获取对应的回收站
      const station = this.stations[markerId];
      
      if (station) {
        this.selectStation(station);
      }
    },
    
    // 气泡点击事件
    onCalloutTap(e) {
      // 与标记点击事件相同的处理
      this.onMarkerTap(e);
    },
    
    // 地图区域变化事件
    onMapRegionChange(e) {
      // 在实际应用中，可以根据地图区域变化重新搜索回收站
      console.log('Map region changed:', e);
    },
    
    // 选择回收站
    selectStation(station) {
      this.selectedStation = station;
      this.selectedStationId = station.id;
      this.showStationList = false;
      
      // 移动地图到选中的回收站
      this.mapCenter = {
        latitude: station.latitude,
        longitude: station.longitude
      };
    },
    
    // 关闭回收站详情
    closeStationDetail() {
      this.selectedStation = null;
      this.selectedStationId = '';
      this.showStationList = true;
    },
    
    // 查看回收站详情
    viewStationDetail(station) {
      uni.navigateTo({
        url: `/pages/recycle-map/station-detail?id=${station.id}`
      });
    },
    
    // 导航到回收站
    navigateToStation(station) {
      try {
        // 打开导航
        mapService.openNavigation({
          latitude: station.latitude,
          longitude: station.longitude,
          name: station.name
        });
      } catch (error) {
        console.error('Failed to navigate to station:', error);
        
        uni.showToast({
          title: '导航失败，请重试',
          icon: 'none'
        });
      }
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
    
    // 切换回收站列表显示状态
    toggleStationList() {
      this.showStationList = !this.showStationList;
    },
    
    // 搜索回收站
    searchStations() {
      this.searchNearbyStations();
    },
    
    // 清除搜索
    clearSearch() {
      this.searchKeyword = '';
      this.searchStations();
    },
    
    // 显示筛选选项
    showFilterOptions() {
      this.showFilter = true;
    },
    
    // 隐藏筛选选项
    hideFilterOptions() {
      this.showFilter = false;
    },
    
    // 半径变化事件
    onRadiusChange(e) {
      this.searchRadius = e.detail.value;
    },
    
    // 切换回收类型
    toggleRecycleType(type) {
      const index = this.selectedTypes.indexOf(type);
      
      if (index === -1) {
        // 添加类型
        this.selectedTypes.push(type);
      } else {
        // 移除类型
        this.selectedTypes.splice(index, 1);
      }
    },
    
    // 切换其他选项
    toggleOtherOption(option) {
      const index = this.selectedOptions.indexOf(option);
      
      if (index === -1) {
        // 添加选项
        this.selectedOptions.push(option);
      } else {
        // 移除选项
        this.selectedOptions.splice(index, 1);
      }
    },
    
    // 重置筛选条件
    resetFilters() {
      this.searchRadius = 5000;
      this.selectedTypes = [];
      this.selectedOptions = [];
    },
    
    // 应用筛选条件
    applyFilters() {
      this.hideFilterOptions();
      this.searchNearbyStations();
    },
    
    // 格式化距离
    formatDistance(distance) {
      if (distance >= 1000) {
        return (distance / 1000).toFixed(1) + 'km';
      }
      return distance + 'm';
    }
  }
};
</script>

<style>
.map-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F5F5;
}

.search-bar {
  height: 50px;
  background-color: white;
  display: flex;
  align-items: center;
  padding: 0 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.search-input-container {
  flex: 1;
  height: 36px;
  background-color: #F5F5F5;
  border-radius: 18px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  margin-right: 10px;
}

.search-icon {
  width: 16px;
  height: 16px;
  margin-right: 5px;
}

.search-input {
  flex: 1;
  height: 36px;
  font-size: 14px;
}

.clear-btn {
  width: 16px;
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.clear-icon {
  font-size: 16px;
  color: #999;
}

.filter-btn {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.filter-icon {
  width: 20px;
  height: 20px;
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

.station-list {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 50%;
  transition: max-height 0.3s;
}

.station-list.expanded {
  max-height: 70%;
}

.list-header {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid #EEEEEE;
}

.list-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.list-count {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.toggle-btn {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-icon {
  font-size: 16px;
  color: #666;
}

.list-content {
  max-height: calc(70vh - 50px);
}

.station-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #EEEEEE;
}

.station-item.active {
  background-color: #E8F5E9;
}

.station-info {
  flex: 1;
  margin-right: 10px;
}

.station-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
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

.navigate-btn {
  background-color: #4CAF50;
  padding: 5px 10px;
  border-radius: 15px;
}

.navigate-text {
  font-size: 12px;
  color: white;
}

.empty-state {
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-image {
  width: 100px;
  height: 100px;
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
}

.loading-state {
  padding: 30px 0;
  display: flex;
  justify-content: center;
}

.station-detail-card {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
  padding: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.close-icon {
  font-size: 20px;
  color: #666;
}

.card-content {
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.detail-icon {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  margin-top: 2px;
}

.detail-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.recycle-types {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
}

.recycle-type {
  font-size: 12px;
  color: #4CAF50;
  background-color: #E8F5E9;
  padding: 2px 6px;
  border-radius: 10px;
  margin-right: 5px;
  margin-bottom: 5px;
}

.card-actions {
  display: flex;
}

.action-btn {
  flex: 1;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  margin: 0 5px;
}

.detail-btn {
  background-color: #F5F5F5;
  color: #333;
}

.navigate-btn {
  background-color: #4CAF50;
  color: white;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 5px;
}

.btn-text {
  font-size: 14px;
}

.filter-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.filter-overlay {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
}

.filter-content {
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  padding: 15px;
  max-height: 70vh;
  overflow-y: auto;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.filter-close {
  font-size: 20px;
  color: #666;
}

.filter-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.radius-slider {
  padding: 0 10px;
}

.radius-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}

.radius-min, .radius-max {
  font-size: 12px;
  color: #666;
}

.type-options, .other-options {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -5px;
}

.type-option, .other-option {
  margin: 0 5px 10px;
  padding: 8px 15px;
  background-color: #F5F5F5;
  border-radius: 20px;
}

.type-option.selected, .other-option.selected {
  background-color: #4CAF50;
}

.type-text, .option-text {
  font-size: 14px;
  color: #333;
}

.type-option.selected .type-text, .other-option.selected .option-text {
  color: white;
}

.filter-actions {
  display: flex;
  margin-top: 20px;
}

.filter-btn {
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 20px;
  margin: 0 5px;
}

.reset-btn {
  background-color: #F5F5F5;
  color: #333;
}

.apply-btn {
  background-color: #4CAF50;
  color: white;
}
</style>
