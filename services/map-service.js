/**
 * 地图服务
 * 提供高德地图相关功能
 */

class MapService {
  constructor() {
    this.isInitialized = false;
    this.mapKey = ''; // 高德地图API密钥
    this.userLocation = null;
    this.recycleStations = [];
  }

  /**
   * 初始化地图服务
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init() {
    try {
      console.log('Initializing Map Service');
      
      // 获取高德地图API密钥
      this.mapKey = this.getMapKey();
      
      // 初始化成功
      this.isInitialized = true;
      console.log('Map Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Error initializing Map Service:', error);
      return false;
    }
  }

  /**
   * 获取高德地图API密钥
   * @returns {string} API密钥
   */
  getMapKey() {
    // 在实际应用中，这里会从配置文件或环境变量获取API密钥
    // 这里使用模拟数据
    return 'your_amap_key_here';
  }

  /**
   * 获取用户当前位置
   * @returns {Promise<object>} 用户位置
   */
  async getUserLocation() {
    return new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02', // 高德地图、腾讯地图使用的坐标系
        success: (res) => {
          console.log('Got user location:', res);
          
          this.userLocation = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          
          resolve(this.userLocation);
        },
        fail: (err) => {
          console.error('Failed to get user location:', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 搜索附近回收站
   * @param {object} options 搜索选项
   * @param {number} options.latitude 纬度
   * @param {number} options.longitude 经度
   * @param {number} options.radius 搜索半径，单位米，默认5000
   * @param {string} options.keywords 关键词，默认"回收站"
   * @returns {Promise<Array>} 回收站列表
   */
  async searchNearbyStations(options = {}) {
    try {
      // 如果没有提供位置，使用用户当前位置
      if (!options.latitude || !options.longitude) {
        if (!this.userLocation) {
          await this.getUserLocation();
        }
        
        options.latitude = this.userLocation.latitude;
        options.longitude = this.userLocation.longitude;
      }
      
      // 设置默认值
      const radius = options.radius || 5000;
      const keywords = options.keywords || '回收站';
      
      console.log('Searching nearby stations:', options);
      
      // 在实际应用中，这里会调用高德地图API搜索附近的回收站
      // 这里使用模拟数据
      const stations = await this.getMockStations(options.latitude, options.longitude, radius);
      
      this.recycleStations = stations;
      
      return stations;
    } catch (error) {
      console.error('Error searching nearby stations:', error);
      throw error;
    }
  }

  /**
   * 获取模拟回收站数据
   * @param {number} latitude 纬度
   * @param {number} longitude 经度
   * @param {number} radius 搜索半径
   * @returns {Promise<Array>} 回收站列表
   */
  async getMockStations(latitude, longitude, radius) {
    // 生成一些模拟的回收站数据
    const stations = [
      {
        id: '1',
        name: '社区环保回收站',
        address: '北京市海淀区中关村南大街5号',
        latitude: latitude + 0.01,
        longitude: longitude + 0.01,
        distance: this.calculateDistance(latitude, longitude, latitude + 0.01, longitude + 0.01),
        tags: ['社区回收站', '24小时'],
        recycleTypes: ['塑料', '纸类', '金属', '玻璃'],
        openTime: '08:00-20:00',
        contact: '010-12345678'
      },
      {
        id: '2',
        name: '绿色回收中心',
        address: '北京市海淀区学院路15号',
        latitude: latitude - 0.005,
        longitude: longitude + 0.008,
        distance: this.calculateDistance(latitude, longitude, latitude - 0.005, longitude + 0.008),
        tags: ['大型回收中心', '有补贴'],
        recycleTypes: ['塑料', '纸类', '金属', '玻璃', '电子垃圾'],
        openTime: '09:00-18:00',
        contact: '010-87654321'
      },
      {
        id: '3',
        name: '环保回收点',
        address: '北京市朝阳区建国路88号',
        latitude: latitude + 0.008,
        longitude: longitude - 0.003,
        distance: this.calculateDistance(latitude, longitude, latitude + 0.008, longitude - 0.003),
        tags: ['小型回收点'],
        recycleTypes: ['塑料', '纸类'],
        openTime: '08:30-19:30',
        contact: '010-55556666'
      },
      {
        id: '4',
        name: '再生资源回收站',
        address: '北京市西城区西直门外大街1号',
        latitude: latitude - 0.012,
        longitude: longitude - 0.009,
        distance: this.calculateDistance(latitude, longitude, latitude - 0.012, longitude - 0.009),
        tags: ['大型回收中心', '24小时', '有补贴'],
        recycleTypes: ['塑料', '纸类', '金属', '玻璃', '电子垃圾', '有害垃圾'],
        openTime: '全天',
        contact: '010-99998888'
      }
    ];
    
    // 按距离排序
    stations.sort((a, b) => a.distance - b.distance);
    
    // 过滤掉超出半径的站点
    return stations.filter(station => station.distance <= radius);
  }

  /**
   * 计算两点之间的距离
   * @param {number} lat1 第一点纬度
   * @param {number} lon1 第一点经度
   * @param {number} lat2 第二点纬度
   * @param {number} lon2 第二点经度
   * @returns {number} 距离，单位米
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径，单位米
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance);
  }

  /**
   * 角度转弧度
   * @param {number} deg 角度
   * @returns {number} 弧度
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * 获取导航URL
   * @param {object} options 导航选项
   * @param {number} options.startLat 起点纬度
   * @param {number} options.startLng 起点经度
   * @param {number} options.endLat 终点纬度
   * @param {number} options.endLng 终点经度
   * @param {string} options.endName 终点名称
   * @returns {string} 导航URL
   */
  getNavigationUrl(options) {
    // 构建高德地图导航URL
    return `https://uri.amap.com/navigation?from=${options.startLng},${options.startLat},我的位置&to=${options.endLng},${options.endLat},${options.endName}&mode=walking&policy=1&src=myapp&callnative=0`;
  }

  /**
   * 打开导航
   * @param {object} options 导航选项
   * @param {number} options.latitude 终点纬度
   * @param {number} options.longitude 终点经度
   * @param {string} options.name 终点名称
   * @returns {Promise<void>}
   */
  async openNavigation(options) {
    try {
      // 如果没有用户位置，获取用户位置
      if (!this.userLocation) {
        await this.getUserLocation();
      }
      
      // 构建导航参数
      const navOptions = {
        startLat: this.userLocation.latitude,
        startLng: this.userLocation.longitude,
        endLat: options.latitude,
        endLng: options.longitude,
        endName: options.name
      };
      
      // 获取导航URL
      const url = this.getNavigationUrl(navOptions);
      
      // 打开导航
      uni.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
      });
    } catch (error) {
      console.error('Error opening navigation:', error);
      throw error;
    }
  }

  /**
   * 获取回收站详情
   * @param {string} id 回收站ID
   * @returns {Promise<object>} 回收站详情
   */
  async getStationDetail(id) {
    try {
      // 查找回收站
      const station = this.recycleStations.find(item => item.id === id);
      
      if (station) {
        return station;
      }
      
      // 如果在缓存中找不到，从API获取
      // 在实际应用中，这里会调用高德地图API获取POI详情
      // 这里使用模拟数据
      return this.getMockStationDetail(id);
    } catch (error) {
      console.error('Error getting station detail:', error);
      throw error;
    }
  }

  /**
   * 获取模拟回收站详情
   * @param {string} id 回收站ID
   * @returns {Promise<object>} 回收站详情
   */
  async getMockStationDetail(id) {
    // 模拟数据
    const stations = {
      '1': {
        id: '1',
        name: '社区环保回收站',
        address: '北京市海淀区中关村南大街5号',
        latitude: 39.908187,
        longitude: 116.394451,
        distance: 500,
        tags: ['社区回收站', '24小时'],
        recycleTypes: ['塑料', '纸类', '金属', '玻璃'],
        openTime: '08:00-20:00',
        contact: '010-12345678',
        description: '社区环保回收站是一个便民的垃圾分类回收点，主要回收塑料、纸类、金属和玻璃等可回收物。',
        images: [
          '/static/images/station1_1.jpg',
          '/static/images/station1_2.jpg'
        ],
        rating: 4.5,
        comments: [
          {
            user: '用户1',
            content: '服务很好，回收种类齐全',
            time: '2023-05-01'
          },
          {
            user: '用户2',
            content: '位置很方便，就在小区门口',
            time: '2023-04-15'
          }
        ]
      },
      '2': {
        id: '2',
        name: '绿色回收中心',
        address: '北京市海淀区学院路15号',
        latitude: 39.912345,
        longitude: 116.405678,
        distance: 1200,
        tags: ['大型回收中心', '有补贴'],
        recycleTypes: ['塑料', '纸类', '金属', '玻璃', '电子垃圾'],
        openTime: '09:00-18:00',
        contact: '010-87654321',
        description: '绿色回收中心是一个综合性的回收站，除了常规的可回收物外，还接收电子垃圾等特殊垃圾。回收物达到一定重量还有现金补贴。',
        images: [
          '/static/images/station2_1.jpg',
          '/static/images/station2_2.jpg'
        ],
        rating: 4.8,
        comments: [
          {
            user: '用户3',
            content: '回收种类很全，还有补贴，很不错',
            time: '2023-05-10'
          },
          {
            user: '用户4',
            content: '工作人员很专业，分类指导很到位',
            time: '2023-05-05'
          }
        ]
      }
    };
    
    return stations[id] || null;
  }
}

// 导出单例实例
const mapService = new MapService();
export default mapService;
