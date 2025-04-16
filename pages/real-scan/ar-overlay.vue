<template>
  <view class="ar-overlay" :class="{ 'show': true }">
    <!-- 结果卡片 -->
    <view class="result-card">
      <!-- 顶部图片区域 -->
      <view class="result-image-container">
        <image class="result-image" :src="imagePath" mode="aspectFill"></image>
        <view class="result-label" :class="{ 'recyclable': result.recyclable, 'non-recyclable': !result.recyclable }">
          {{ result.recyclable ? '可回收物' : '不可回收物' }}
        </view>
      </view>
      
      <!-- 结果信息 -->
      <view class="result-info">
        <view class="result-title">
          <text class="material-name">{{ result.label }}</text>
          <text class="confidence">{{ (result.probability * 100).toFixed(0) }}% 匹配度</text>
        </view>
        
        <view class="info-section">
          <view class="info-item">
            <text class="info-label">材质类型</text>
            <text class="info-value">{{ result.materialType }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">自然分解时间</text>
            <text class="info-value">{{ result.decompositionTime }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">回收方法</text>
            <text class="info-value">{{ result.recyclingMethod }}</text>
          </view>
        </view>
      </view>
      
      <!-- 3D模型展示区域 -->
      <view class="model-container">
        <view class="model-title">
          <text>物品拆解</text>
          <text class="model-subtitle">了解回收过程</text>
        </view>
        
        <view class="model-viewer">
          <!-- 在实际应用中，这里会使用Three.js或其他3D库渲染模型 -->
          <!-- 这里使用图片模拟 -->
          <image 
            class="model-image" 
            :src="getModelImagePath()" 
            mode="aspectFit"
          ></image>
          
          <!-- 拆解步骤控制 -->
          <view class="model-controls">
            <view 
              class="step-btn" 
              :class="{ 'active': currentStep === 0 }" 
              @click="setModelStep(0)"
            >
              原始
            </view>
            <view 
              class="step-btn" 
              :class="{ 'active': currentStep === 1 }" 
              @click="setModelStep(1)"
            >
              步骤1
            </view>
            <view 
              class="step-btn" 
              :class="{ 'active': currentStep === 2 }" 
              @click="setModelStep(2)"
            >
              步骤2
            </view>
          </view>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn cancel-btn" @click="onClose">重新扫描</button>
        <button class="action-btn confirm-btn" @click="onConfirm">确认回收</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    result: {
      type: Object,
      required: true
    },
    imagePath: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      currentStep: 0
    };
  },
  methods: {
    /**
     * 关闭结果显示
     */
    onClose() {
      this.$emit('close');
    },
    
    /**
     * 确认结果
     */
    onConfirm() {
      this.$emit('confirm', {
        result: this.result,
        imagePath: this.imagePath
      });
    },
    
    /**
     * 设置模型步骤
     */
    setModelStep(step) {
      this.currentStep = step;
    },
    
    /**
     * 获取模型图片路径
     */
    getModelImagePath() {
      // 根据物品类型和当前步骤返回对应的模型图片
      const baseType = this.result.label;
      
      // 在实际应用中，这里会根据物品类型和步骤返回不同的图片
      // 这里使用模拟数据
      const modelImages = {
        '塑料': [
          '/static/ar-assets/plastic_step0.png',
          '/static/ar-assets/plastic_step1.png',
          '/static/ar-assets/plastic_step2.png'
        ],
        '纸类': [
          '/static/ar-assets/paper_step0.png',
          '/static/ar-assets/paper_step1.png',
          '/static/ar-assets/paper_step2.png'
        ],
        '金属': [
          '/static/ar-assets/metal_step0.png',
          '/static/ar-assets/metal_step1.png',
          '/static/ar-assets/metal_step2.png'
        ],
        '玻璃': [
          '/static/ar-assets/glass_step0.png',
          '/static/ar-assets/glass_step1.png',
          '/static/ar-assets/glass_step2.png'
        ],
        '有害垃圾': [
          '/static/ar-assets/hazardous_step0.png',
          '/static/ar-assets/hazardous_step1.png',
          '/static/ar-assets/hazardous_step2.png'
        ],
        '厨余垃圾': [
          '/static/ar-assets/food_step0.png',
          '/static/ar-assets/food_step1.png',
          '/static/ar-assets/food_step2.png'
        ]
      };
      
      // 获取当前物品类型的模型图片
      const images = modelImages[baseType] || [
        '/static/ar-assets/default_step0.png',
        '/static/ar-assets/default_step1.png',
        '/static/ar-assets/default_step2.png'
      ];
      
      // 返回当前步骤的图片
      return images[this.currentStep];
    }
  }
};
</script>

<style>
.ar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s;
}

.ar-overlay.show {
  opacity: 1;
}

.result-card {
  width: 90%;
  max-width: 400px;
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.result-image-container {
  position: relative;
  width: 100%;
  height: 200px;
}

.result-image {
  width: 100%;
  height: 100%;
}

.result-label {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.result-label.recyclable {
  background-color: #4CAF50;
  color: white;
}

.result-label.non-recyclable {
  background-color: #F44336;
  color: white;
}

.result-info {
  padding: 15px;
}

.result-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.material-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.confidence {
  font-size: 14px;
  color: #666;
  background-color: #F5F5F5;
  padding: 3px 8px;
  border-radius: 10px;
}

.info-section {
  margin-bottom: 15px;
}

.info-item {
  margin-bottom: 10px;
}

.info-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 3px;
  display: block;
}

.info-value {
  font-size: 16px;
  color: #333;
}

.model-container {
  padding: 15px;
  background-color: #F9F9F9;
}

.model-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-subtitle {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}

.model-viewer {
  position: relative;
  width: 100%;
  height: 200px;
  background-color: #EFEFEF;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.model-image {
  width: 100%;
  height: 100%;
}

.model-controls {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.step-btn {
  padding: 5px 15px;
  margin: 0 5px;
  background-color: #EFEFEF;
  border-radius: 15px;
  font-size: 12px;
  color: #666;
}

.step-btn.active {
  background-color: #4CAF50;
  color: white;
}

.action-buttons {
  display: flex;
  padding: 15px;
  border-top: 1px solid #EFEFEF;
}

.action-btn {
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 20px;
  font-size: 14px;
  margin: 0 5px;
}

.cancel-btn {
  background-color: #F5F5F5;
  color: #666;
}

.confirm-btn {
  background-color: #4CAF50;
  color: white;
}
</style>
