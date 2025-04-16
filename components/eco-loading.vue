<template>
  <view class="eco-loading" :class="{ 'is-fullscreen': fullscreen }">
    <view class="eco-loading__spinner">
      <view class="eco-loading__circular">
        <view class="eco-loading__path"></view>
      </view>
    </view>
    <view class="eco-loading__text" v-if="text">{{ text }}</view>
  </view>
</template>

<script>
export default {
  name: 'EcoLoading',
  props: {
    text: {
      type: String,
      default: '加载中...'
    },
    fullscreen: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style>
.eco-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.eco-loading.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.eco-loading__spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
}

.eco-loading__circular {
  width: 100%;
  height: 100%;
  animation: eco-loading-rotate 2s linear infinite;
}

.eco-loading__path {
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: eco-loading-dash 1.5s ease-in-out infinite;
}

.eco-loading__text {
  font-size: 14px;
  color: #666;
}

@keyframes eco-loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes eco-loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120;
  }
}
</style>
