<template>
  <view class="real-scan-container">
    <!-- 相机预览 -->
    <camera
      class="camera"
      device-position="back"
      flash="off"
      @error="onCameraError"
      @ready="onCameraReady"
    ></camera>
    
    <!-- 扫描框 -->
    <view class="scan-frame" :class="{ 'scanning': scanning }">
      <view class="scan-line" v-if="scanning"></view>
    </view>
    
    <!-- 扫描提示 -->
    <view class="scan-tips" v-if="!showResult">
      <text class="tips-text">将垃圾对准框内，自动识别</text>
    </view>
    
    <!-- 控制按钮 -->
    <view class="control-panel" v-if="!showResult">
      <view class="control-btn album-btn" @click="chooseFromAlbum">
        <image class="btn-icon" src="/static/icons/gallery.png"></image>
        <text class="btn-text">相册</text>
      </view>
      
      <view class="control-btn scan-btn" @click="toggleScanning">
        <image class="btn-icon" :src="scanning ? '/static/icons/stop.png' : '/static/icons/scan.png'"></image>
        <text class="btn-text">{{ scanning ? '停止' : '扫描' }}</text>
      </view>
      
      <view class="control-btn flash-btn" @click="toggleFlash">
        <image class="btn-icon" :src="flashOn ? '/static/icons/flash-on.png' : '/static/icons/flash-off.png'"></image>
        <text class="btn-text">闪光灯</text>
      </view>
    </view>
    
    <!-- 识别结果 -->
    <ar-overlay
      v-if="showResult"
      :result="recognitionResult"
      :image-path="tempImagePath"
      @close="rescan"
      @confirm="confirmResult"
    ></ar-overlay>
    
    <!-- 初始化错误提示 -->
    <view class="init-error" v-if="initError">
      <text class="error-text">{{ initError }}</text>
      <button class="retry-btn" @click="initARScanner">重试</button>
    </view>
    
    <!-- 加载提示 -->
    <view class="loading-container" v-if="!initialized && !initError">
      <eco-loading text="正在初始化AR模块..."></eco-loading>
    </view>
  </view>
</template>

<script>
import arCameraController from '../../mixins/ar-camera-controller.js';
import ArOverlay from './ar-overlay.vue';

export default {
  components: {
    ArOverlay
  },
  mixins: [arCameraController],
  data() {
    return {
      flashOn: false
    };
  },
  methods: {
    /**
     * 切换扫描状态
     */
    toggleScanning() {
      if (this.scanning) {
        this.stopScanning();
      } else {
        this.startScanning();
      }
    },
    
    /**
     * 切换闪光灯
     */
    toggleFlash() {
      this.flashOn = !this.flashOn;
      
      if (this.cameraContext) {
        const flashMode = this.flashOn ? 'on' : 'off';
        
        // 设置闪光灯模式
        this.cameraConfig.flash = flashMode;
        
        uni.showToast({
          title: this.flashOn ? '闪光灯已开启' : '闪光灯已关闭',
          icon: 'none'
        });
      }
    },
    
    /**
     * 确认识别结果
     */
    confirmResult(data) {
      // 记录回收行为
      this.recordRecycleAction(data.result);
      
      // 跳转到结果页面
      uni.navigateTo({
        url: '/pages/real-scan/result?data=' + encodeURIComponent(JSON.stringify(data.result))
      });
    },
    
    /**
     * 记录回收行为
     */
    async recordRecycleAction(result) {
      try {
        // 计算积分（根据物品类型和可回收性）
        let points = 0;
        
        if (result.recyclable) {
          // 可回收物品基础积分为10
          points = 10;
          
          // 根据物品类型调整积分
          switch (result.label) {
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
        } else {
          // 不可回收物品基础积分为5
          points = 5;
        }
        
        // 保存回收记录到本地存储
        this.saveRecycleRecord({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          itemType: result.label,
          points: points,
          imagePath: this.tempImagePath
        });
        
        // 更新用户积分
        this.updateUserPoints(points);
        
        console.log('Recycle action recorded, points:', points);
      } catch (error) {
        console.error('Failed to record recycle action:', error);
      }
    },
    
    /**
     * 保存回收记录
     */
    saveRecycleRecord(record) {
      try {
        // 获取现有记录
        let records = uni.getStorageSync('recycleRecords') || [];
        
        // 添加新记录
        records.unshift(record);
        
        // 最多保存100条记录
        if (records.length > 100) {
          records = records.slice(0, 100);
        }
        
        // 保存记录
        uni.setStorageSync('recycleRecords', records);
      } catch (error) {
        console.error('Failed to save recycle record:', error);
      }
    },
    
    /**
     * 更新用户积分
     */
    updateUserPoints(points) {
      try {
        // 获取现有积分
        let currentPoints = uni.getStorageSync('userPoints') || 0;
        
        // 更新积分
        currentPoints += points;
        
        // 保存积分
        uni.setStorageSync('userPoints', currentPoints);
        
        // 获取回收次数
        let recycleCount = uni.getStorageSync('recycleCount') || 0;
        
        // 更新回收次数
        recycleCount += 1;
        
        // 保存回收次数
        uni.setStorageSync('recycleCount', recycleCount);
        
        // 检查是否达到NFT铸造条件（每10次回收）
        if (recycleCount % 10 === 0) {
          // 触发NFT铸造事件
          uni.$emit('mint-nft', { recycleCount });
          
          uni.showToast({
            title: '恭喜获得新徽章！',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('Failed to update user points:', error);
      }
    }
  }
};
</script>

<style>
.real-scan-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #000;
}

.camera {
  width: 100%;
  height: 100%;
}

.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  border: 2px solid rgba(76, 175, 80, 0.8);
  border-radius: 15px;
  box-sizing: border-box;
  overflow: hidden;
}

.scan-frame.scanning {
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #4CAF50;
  box-shadow: 0 0 5px #4CAF50;
  animation: scan-animation 2s linear infinite;
}

@keyframes scan-animation {
  0% {
    top: 0;
  }
  50% {
    top: calc(100% - 2px);
  }
  100% {
    top: 0;
  }
}

.scan-tips {
  position: absolute;
  top: calc(50% + 140px);
  left: 0;
  right: 0;
  text-align: center;
}

.tips-text {
  font-size: 14px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 15px;
  border-radius: 15px;
}

.control-panel {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 20px;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-icon {
  width: 50px;
  height: 50px;
  margin-bottom: 5px;
}

.btn-text {
  font-size: 12px;
  color: #fff;
}

.scan-btn .btn-icon {
  width: 70px;
  height: 70px;
}

.init-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
}

.error-text {
  font-size: 16px;
  color: #fff;
  margin-bottom: 20px;
  text-align: center;
  padding: 0 30px;
}

.retry-btn {
  background-color: #4CAF50;
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
}
</style>
