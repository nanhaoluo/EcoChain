<template>
  <view class="eco-card" :class="{ 'is-shadow': shadow }">
    <view class="eco-card__header" v-if="$slots.header || header">
      <slot name="header">{{ header }}</slot>
    </view>
    <view class="eco-card__body" :style="bodyStyle">
      <slot></slot>
    </view>
    <view class="eco-card__footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script>
export default {
  name: 'EcoCard',
  props: {
    header: {
      type: String,
      default: ''
    },
    bodyStyle: {
      type: Object,
      default: () => ({})
    },
    shadow: {
      type: Boolean,
      default: true
    }
  }
};
</script>

<style>
.eco-card {
  border-radius: 10px;
  background-color: #fff;
  overflow: hidden;
  margin-bottom: 15px;
  box-sizing: border-box;
}

.eco-card.is-shadow {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.eco-card__header {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.eco-card__body {
  padding: 15px;
}

.eco-card__footer {
  padding: 15px;
  border-top: 1px solid #f0f0f0;
}
</style>
