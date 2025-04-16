<template>
  <view class="eco-empty">
    <image class="eco-empty__image" :src="image" mode="aspectFit"></image>
    <view class="eco-empty__description">
      <slot>{{ description }}</slot>
    </view>
    <view class="eco-empty__bottom" v-if="$slots.default">
      <slot name="default"></slot>
    </view>
  </view>
</template>

<script>
export default {
  name: 'EcoEmpty',
  props: {
    image: {
      type: String,
      default: '/static/images/empty-state.png'
    },
    description: {
      type: String,
      default: '暂无数据'
    }
  }
};
</script>

<style>
.eco-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.eco-empty__image {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.eco-empty__description {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
  text-align: center;
}

.eco-empty__bottom {
  margin-top: 20px;
}
</style>
