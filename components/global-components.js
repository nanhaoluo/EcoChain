// 全局组件注册文件

import Vue from 'vue';

// 自定义组件
import EcoButton from './eco-button.vue';
import EcoCard from './eco-card.vue';
import EcoLoading from './eco-loading.vue';
import EcoEmpty from './eco-empty.vue';

// 注册全局组件
Vue.component('eco-button', EcoButton);
Vue.component('eco-card', EcoCard);
Vue.component('eco-loading', EcoLoading);
Vue.component('eco-empty', EcoEmpty);
