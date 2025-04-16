/**
 * 应用程序集成服务
 * 负责协调各个模块之间的交互
 */

// 导入各个服务
import arScannerService from './ar-scanner-service.js';
import blockchainService from './blockchain-service.js';
import mapService from './map-service.js';

class IntegrationService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * 初始化集成服务
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init() {
    // 如果已经初始化或正在初始化，直接返回初始化Promise
    if (this.isInitialized || this.initPromise) {
      return this.initPromise || Promise.resolve(this.isInitialized);
    }

    // 创建初始化Promise
    this.initPromise = new Promise(async (resolve) => {
      try {
        console.log('Initializing Integration Service');
        
        // 初始化各个服务
        const arInitPromise = arScannerService.init();
        const blockchainInitPromise = blockchainService.init();
        const mapInitPromise = mapService.init();
        
        // 并行初始化所有服务
        const [arInitResult, blockchainInitResult, mapInitResult] = await Promise.all([
          arInitPromise.catch(err => {
            console.error('AR Scanner Service initialization failed:', err);
            return false;
          }),
          blockchainInitPromise.catch(err => {
            console.error('Blockchain Service initialization failed:', err);
            return false;
          }),
          mapInitPromise.catch(err => {
            console.error('Map Service initialization failed:', err);
            return false;
          })
        ]);
        
        // 检查初始化结果
        this.isInitialized = arInitResult && blockchainInitResult && mapInitResult;
        
        if (this.isInitialized) {
          console.log('Integration Service initialized successfully');
          
          // 设置事件监听
          this.setupEventListeners();
        } else {
          console.error('Integration Service initialization failed');
        }
        
        resolve(this.isInitialized);
      } catch (error) {
        console.error('Error initializing Integration Service:', error);
        this.isInitialized = false;
        resolve(false);
      } finally {
        // 清除初始化Promise
        this.initPromise = null;
      }
    });
    
    return this.initPromise;
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听回收行为事件
    uni.$on('recycle-action', this.handleRecycleAction.bind(this));
    
    // 监听NFT铸造事件
    uni.$on('mint-nft', this.handleNFTMint.bind(this));
    
    // 监听导航事件
    uni.$on('navigate-to-station', this.handleNavigateToStation.bind(this));
    
    console.log('Event listeners set up');
  }

  /**
   * 处理回收行为事件
   * @param {object} data 回收行为数据
   */
  async handleRecycleAction(data) {
    try {
      console.log('Handling recycle action:', data);
      
      // 记录回收行为到区块链
      const receipt = await blockchainService.recordRecycle(data.points);
      
      console.log('Recycle action recorded:', receipt);
      
      // 触发UI更新事件
      uni.$emit('recycle-action-recorded', {
        receipt,
        points: data.points
      });
    } catch (error) {
      console.error('Error handling recycle action:', error);
    }
  }

  /**
   * 处理NFT铸造事件
   * @param {object} data NFT铸造数据
   */
  async handleNFTMint(data) {
    try {
      console.log('Handling NFT mint:', data);
      
      // 更新用户NFT数据
      await blockchainService.getUserNFTs();
      
      // 触发UI更新事件
      uni.$emit('nft-minted', {
        recycleCount: data.recycleCount,
        nfts: blockchainService.userNFTs
      });
    } catch (error) {
      console.error('Error handling NFT mint:', error);
    }
  }

  /**
   * 处理导航到回收站事件
   * @param {object} data 导航数据
   */
  async handleNavigateToStation(data) {
    try {
      console.log('Handling navigate to station:', data);
      
      // 打开导航
      await mapService.openNavigation({
        latitude: data.latitude,
        longitude: data.longitude,
        name: data.name
      });
    } catch (error) {
      console.error('Error handling navigate to station:', error);
    }
  }

  /**
   * 处理AR扫描结果
   * @param {object} result AR扫描结果
   * @returns {Promise<object>} 处理结果
   */
  async processARScanResult(result) {
    try {
      console.log('Processing AR scan result:', result);
      
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
      
      // 记录回收行为
      const recycleData = {
        itemType: result.label,
        points: points,
        recyclable: result.recyclable
      };
      
      // 触发回收行为事件
      uni.$emit('recycle-action', recycleData);
      
      return {
        ...result,
        points
      };
    } catch (error) {
      console.error('Error processing AR scan result:', error);
      throw error;
    }
  }

  /**
   * 查找附近回收站
   * @param {object} options 搜索选项
   * @returns {Promise<Array>} 回收站列表
   */
  async findNearbyRecycleStations(options = {}) {
    try {
      console.log('Finding nearby recycle stations:', options);
      
      // 搜索附近回收站
      const stations = await mapService.searchNearbyStations(options);
      
      // 过滤回收站
      const filteredStations = this.filterStationsByRecycleType(stations, options.recycleType);
      
      return filteredStations;
    } catch (error) {
      console.error('Error finding nearby recycle stations:', error);
      throw error;
    }
  }

  /**
   * 根据回收类型过滤回收站
   * @param {Array} stations 回收站列表
   * @param {string} recycleType 回收类型
   * @returns {Array} 过滤后的回收站列表
   */
  filterStationsByRecycleType(stations, recycleType) {
    // 如果没有指定回收类型，返回所有站点
    if (!recycleType) {
      return stations;
    }
    
    // 过滤支持指定回收类型的站点
    return stations.filter(station => {
      return station.recycleTypes && station.recycleTypes.includes(recycleType);
    });
  }

  /**
   * 获取用户数据
   * @returns {Promise<object>} 用户数据
   */
  async getUserData() {
    try {
      console.log('Getting user data');
      
      // 获取区块链用户数据
      const blockchainData = await blockchainService.getUserData();
      
      // 获取用户位置
      let userLocation = null;
      try {
        userLocation = await mapService.getUserLocation();
      } catch (error) {
        console.error('Error getting user location:', error);
      }
      
      // 整合用户数据
      const userData = {
        ...blockchainData,
        location: userLocation
      };
      
      return userData;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  /**
   * 释放资源
   */
  dispose() {
    // 移除事件监听
    uni.$off('recycle-action', this.handleRecycleAction);
    uni.$off('mint-nft', this.handleNFTMint);
    uni.$off('navigate-to-station', this.handleNavigateToStation);
    
    // 释放各个服务资源
    arScannerService.dispose();
    blockchainService.disconnect();
    
    this.isInitialized = false;
    console.log('Integration Service resources released');
  }
}

// 导出单例实例
const integrationService = new IntegrationService();
export default integrationService;
