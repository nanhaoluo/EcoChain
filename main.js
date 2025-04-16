/**
 * 项目入口文件
 * 初始化应用程序并配置全局设置
 */

import Vue from 'vue';
import App from './App.vue';
import globalComponents from './components/global-components.js';
import integrationService from './services/integration-service.js';

// 注册全局组件
globalComponents.register();

// 配置Vue
Vue.config.productionTip = false;

// 全局错误处理
Vue.config.errorHandler = function(err, vm, info) {
  console.error('Vue Error:', err);
  console.error('Error Info:', info);
  
  // 在生产环境中，可以将错误上报到服务器
  if (process.env.NODE_ENV === 'production') {
    // 上报错误
    reportError(err, info);
  }
};

// 错误上报函数
function reportError(error, info) {
  // 在实际应用中，这里会将错误上报到服务器
  console.log('Reporting error to server:', error, info);
}

// 初始化应用
async function initApp() {
  try {
    console.log('Initializing EcoChain application...');
    
    // 初始化集成服务
    await integrationService.init();
    
    // 创建Vue实例
    new Vue({
      render: h => h(App)
    }).$mount('#app');
    
    console.log('EcoChain application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize EcoChain application:', error);
    
    // 显示错误提示
    uni.showModal({
      title: '初始化失败',
      content: '应用程序初始化失败，请重试',
      showCancel: false
    });
  }
}

// 启动应用
initApp();
