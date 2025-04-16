<template>
  <button 
    class="eco-button" 
    :class="[
      type ? 'eco-button--' + type : '',
      size ? 'eco-button--' + size : '',
      { 'is-disabled': disabled, 'is-loading': loading, 'is-round': round, 'is-plain': plain }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <view class="eco-button__content" v-if="!loading">
      <slot></slot>
    </view>
    <view class="eco-button__loading" v-else>
      <view class="loading-spinner"></view>
    </view>
  </button>
</template>

<script>
export default {
  name: 'EcoButton',
  props: {
    type: {
      type: String,
      default: 'primary',
      validator: (value) => {
        return ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'text'].includes(value);
      }
    },
    size: {
      type: String,
      default: 'normal',
      validator: (value) => {
        return ['small', 'normal', 'large'].includes(value);
      }
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    round: {
      type: Boolean,
      default: false
    },
    plain: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick(event) {
      if (this.disabled || this.loading) return;
      this.$emit('click', event);
    }
  }
};
</script>

<style>
.eco-button {
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: .1s;
  font-weight: 500;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 4px;
}

.eco-button--primary {
  color: #fff;
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.eco-button--primary.is-plain {
  color: #4CAF50;
  background: #e8f5e9;
  border-color: #4CAF50;
}

.eco-button--secondary {
  color: #fff;
  background-color: #2196F3;
  border-color: #2196F3;
}

.eco-button--secondary.is-plain {
  color: #2196F3;
  background: #e3f2fd;
  border-color: #2196F3;
}

.eco-button--success {
  color: #fff;
  background-color: #8BC34A;
  border-color: #8BC34A;
}

.eco-button--success.is-plain {
  color: #8BC34A;
  background: #f1f8e9;
  border-color: #8BC34A;
}

.eco-button--warning {
  color: #fff;
  background-color: #FF9800;
  border-color: #FF9800;
}

.eco-button--warning.is-plain {
  color: #FF9800;
  background: #fff3e0;
  border-color: #FF9800;
}

.eco-button--danger {
  color: #fff;
  background-color: #F44336;
  border-color: #F44336;
}

.eco-button--danger.is-plain {
  color: #F44336;
  background: #ffebee;
  border-color: #F44336;
}

.eco-button--info {
  color: #fff;
  background-color: #9E9E9E;
  border-color: #9E9E9E;
}

.eco-button--info.is-plain {
  color: #9E9E9E;
  background: #f5f5f5;
  border-color: #9E9E9E;
}

.eco-button--text {
  border-color: transparent;
  color: #4CAF50;
  background: transparent;
  padding-left: 0;
  padding-right: 0;
}

.eco-button--small {
  padding: 8px 15px;
  font-size: 12px;
  border-radius: 3px;
}

.eco-button--large {
  padding: 14px 28px;
  font-size: 16px;
  border-radius: 4px;
}

.eco-button.is-round {
  border-radius: 20px;
}

.eco-button.is-disabled,
.eco-button.is-disabled:hover,
.eco-button.is-disabled:focus {
  color: #c0c4cc;
  cursor: not-allowed;
  background-image: none;
  background-color: #fff;
  border-color: #ebeef5;
}

.eco-button--primary.is-disabled,
.eco-button--primary.is-disabled:hover,
.eco-button--primary.is-disabled:focus {
  color: #fff;
  background-color: #a5d6a7;
  border-color: #a5d6a7;
}

.eco-button--primary.is-plain.is-disabled,
.eco-button--primary.is-plain.is-disabled:hover,
.eco-button--primary.is-plain.is-disabled:focus {
  color: #c0c4cc;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}

.eco-button__loading {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-radius: 50%;
  border-top-color: currentColor;
  animation: button-spinner 0.8s linear infinite;
}

@keyframes button-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
