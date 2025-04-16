/**
 * 区块链服务
 * 提供与Polygon链交互的功能
 */

// 导入Web3模块
import uniWeb3 from '../uni_modules/uni-web3/index.js';

class BlockchainService {
  constructor() {
    this.isInitialized = false;
    this.isConnected = false;
    this.userAddress = '';
    this.userPoints = 0;
    this.userRecycleCount = 0;
    this.userNFTs = [];
  }

  /**
   * 初始化区块链服务
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init() {
    try {
      console.log('Initializing Blockchain Service');
      
      // 初始化Web3
      const result = await uniWeb3.init();
      
      if (result) {
        this.isInitialized = true;
        console.log('Blockchain Service initialized successfully');
      } else {
        console.error('Failed to initialize Blockchain Service');
      }
      
      return result;
    } catch (error) {
      console.error('Error initializing Blockchain Service:', error);
      return false;
    }
  }

  /**
   * 连接钱包
   * @returns {Promise<string>} 连接的钱包地址
   */
  async connectWallet() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }
      
      console.log('Connecting wallet');
      
      // 连接钱包
      const address = await uniWeb3.connectWallet();
      
      if (address) {
        this.isConnected = true;
        this.userAddress = address;
        console.log('Wallet connected:', address);
        
        // 获取用户数据
        await this.getUserData();
      }
      
      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * 获取用户数据
   * @returns {Promise<object>} 用户数据
   */
  async getUserData() {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Getting user data');
      
      // 获取环保积分
      this.userPoints = await uniWeb3.getEcoPoints(this.userAddress);
      
      // 获取回收次数
      this.userRecycleCount = await uniWeb3.getRecycleCount(this.userAddress);
      
      // 获取用户NFT
      await this.getUserNFTs();
      
      return {
        address: this.userAddress,
        points: this.userPoints,
        recycleCount: this.userRecycleCount,
        nfts: this.userNFTs
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      
      // 如果链上数据获取失败，尝试从本地存储获取
      this.getUserDataFromLocal();
      
      return {
        address: this.userAddress,
        points: this.userPoints,
        recycleCount: this.userRecycleCount,
        nfts: this.userNFTs
      };
    }
  }

  /**
   * 从本地存储获取用户数据
   */
  getUserDataFromLocal() {
    try {
      // 获取积分
      const points = uni.getStorageSync('userPoints') || 0;
      this.userPoints = points;
      
      // 获取回收次数
      const recycleCount = uni.getStorageSync('recycleCount') || 0;
      this.userRecycleCount = recycleCount;
      
      // 获取NFT
      const nfts = uni.getStorageSync('userNFTs') || [];
      this.userNFTs = nfts;
      
      console.log('User data loaded from local storage');
    } catch (error) {
      console.error('Error getting user data from local storage:', error);
    }
  }

  /**
   * 获取用户NFT
   * @returns {Promise<Array>} 用户NFT列表
   */
  async getUserNFTs() {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Getting user NFTs');
      
      // 在实际应用中，这里会从区块链获取用户的NFT
      // 这里使用模拟数据
      const nftCount = Math.floor(this.userRecycleCount / 10);
      const nfts = [];
      
      for (let i = 0; i < nftCount; i++) {
        // 获取NFT元数据URI
        const tokenId = i + 1;
        let metadataURI;
        
        try {
          metadataURI = await uniWeb3.getNFTMetadataURI(tokenId);
        } catch (error) {
          console.error('Error getting NFT metadata URI:', error);
          metadataURI = `https://api.ecochain.com/metadata/${tokenId}`;
        }
        
        // 获取NFT余额
        let balance;
        
        try {
          balance = await uniWeb3.getNFTBalance(this.userAddress, tokenId);
        } catch (error) {
          console.error('Error getting NFT balance:', error);
          balance = 1;
        }
        
        if (balance > 0) {
          nfts.push({
            id: tokenId,
            name: `环保徽章 #${tokenId}`,
            description: this.getNFTDescription(tokenId),
            image: `/static/nft/badge_${tokenId}.png`,
            attributes: this.getNFTAttributes(tokenId),
            metadataURI
          });
        }
      }
      
      this.userNFTs = nfts;
      
      // 保存到本地存储
      uni.setStorageSync('userNFTs', nfts);
      
      return nfts;
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      
      // 如果链上数据获取失败，尝试从本地存储获取
      const nfts = uni.getStorageSync('userNFTs') || [];
      this.userNFTs = nfts;
      
      return nfts;
    }
  }

  /**
   * 获取NFT描述
   * @param {number} tokenId NFT的Token ID
   * @returns {string} NFT描述
   */
  getNFTDescription(tokenId) {
    const descriptions = [
      '初级环保徽章，表彰您的环保意识和行动。',
      '中级环保徽章，表彰您持续的环保贡献。',
      '高级环保徽章，表彰您在环保领域的杰出表现。',
      '专家级环保徽章，表彰您在环保领域的专业知识和贡献。',
      '大师级环保徽章，表彰您在环保领域的卓越成就。'
    ];
    
    const index = Math.min(tokenId - 1, descriptions.length - 1);
    return descriptions[index];
  }

  /**
   * 获取NFT属性
   * @param {number} tokenId NFT的Token ID
   * @returns {Array} NFT属性
   */
  getNFTAttributes(tokenId) {
    const levels = ['初级', '中级', '高级', '专家级', '大师级'];
    const rarities = ['普通', '普通', '稀有', '稀有', '传奇'];
    const carbonReductions = [5, 15, 30, 50, 100];
    
    const index = Math.min(tokenId - 1, levels.length - 1);
    
    return [
      {
        trait_type: '等级',
        value: levels[index]
      },
      {
        trait_type: '稀有度',
        value: rarities[index]
      },
      {
        trait_type: '减碳量',
        value: `${carbonReductions[index]}kg`
      },
      {
        trait_type: '发行日期',
        value: new Date().toISOString().split('T')[0]
      }
    ];
  }

  /**
   * 记录回收行为
   * @param {number} points 获得的积分
   * @returns {Promise<object>} 交易收据
   */
  async recordRecycle(points) {
    try {
      if (!this.isConnected) {
        // 如果钱包未连接，保存到本地存储
        return this.recordRecycleLocal(points);
      }
      
      console.log('Recording recycle action, points:', points);
      
      // 记录回收行为
      const receipt = await uniWeb3.recordRecycle(points);
      
      // 更新用户数据
      await this.getUserData();
      
      // 检查是否达到NFT铸造条件（每10次回收）
      if (this.userRecycleCount % 10 === 0) {
        // 触发NFT铸造事件
        uni.$emit('mint-nft', { recycleCount: this.userRecycleCount });
      }
      
      return receipt;
    } catch (error) {
      console.error('Error recording recycle action:', error);
      
      // 如果链上交易失败，保存到本地存储
      return this.recordRecycleLocal(points);
    }
  }

  /**
   * 在本地记录回收行为
   * @param {number} points 获得的积分
   * @returns {Promise<object>} 模拟交易收据
   */
  async recordRecycleLocal(points) {
    try {
      console.log('Recording recycle action locally, points:', points);
      
      // 获取现有积分
      let currentPoints = uni.getStorageSync('userPoints') || 0;
      
      // 更新积分
      currentPoints += points;
      
      // 保存积分
      uni.setStorageSync('userPoints', currentPoints);
      this.userPoints = currentPoints;
      
      // 获取回收次数
      let recycleCount = uni.getStorageSync('recycleCount') || 0;
      
      // 更新回收次数
      recycleCount += 1;
      
      // 保存回收次数
      uni.setStorageSync('recycleCount', recycleCount);
      this.userRecycleCount = recycleCount;
      
      // 检查是否达到NFT铸造条件（每10次回收）
      if (recycleCount % 10 === 0) {
        // 创建新的NFT
        const newNFT = {
          id: Math.floor(recycleCount / 10),
          name: `环保徽章 #${Math.floor(recycleCount / 10)}`,
          description: this.getNFTDescription(Math.floor(recycleCount / 10)),
          image: `/static/nft/badge_${Math.floor(recycleCount / 10)}.png`,
          attributes: this.getNFTAttributes(Math.floor(recycleCount / 10)),
          metadataURI: `https://api.ecochain.com/metadata/${Math.floor(recycleCount / 10)}`
        };
        
        // 获取现有NFT
        let nfts = uni.getStorageSync('userNFTs') || [];
        
        // 添加新NFT
        nfts.push(newNFT);
        
        // 保存NFT
        uni.setStorageSync('userNFTs', nfts);
        this.userNFTs = nfts;
        
        // 触发NFT铸造事件
        uni.$emit('mint-nft', { recycleCount });
      }
      
      return {
        status: 'success',
        points,
        recycleCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error recording recycle action locally:', error);
      throw error;
    }
  }

  /**
   * 兑换积分
   * @param {number} points 兑换的积分数量
   * @param {string} couponType 优惠券类型
   * @returns {Promise<object>} 交易收据
   */
  async redeemPoints(points, couponType) {
    try {
      if (!this.isConnected) {
        // 如果钱包未连接，使用本地存储
        return this.redeemPointsLocal(points, couponType);
      }
      
      console.log('Redeeming points:', points, 'for coupon type:', couponType);
      
      // 兑换积分
      const receipt = await uniWeb3.redeemPoints(points, couponType);
      
      // 更新用户数据
      await this.getUserData();
      
      return receipt;
    } catch (error) {
      console.error('Error redeeming points:', error);
      
      // 如果链上交易失败，使用本地存储
      return this.redeemPointsLocal(points, couponType);
    }
  }

  /**
   * 在本地兑换积分
   * @param {number} points 兑换的积分数量
   * @param {string} couponType 优惠券类型
   * @returns {Promise<object>} 模拟交易收据
   */
  async redeemPointsLocal(points, couponType) {
    try {
      console.log('Redeeming points locally:', points, 'for coupon type:', couponType);
      
      // 获取现有积分
      let currentPoints = uni.getStorageSync('userPoints') || 0;
      
      // 检查积分是否足够
      if (currentPoints < points) {
        throw new Error('Insufficient points');
      }
      
      // 更新积分
      currentPoints -= points;
      
      // 保存积分
      uni.setStorageSync('userPoints', currentPoints);
      this.userPoints = currentPoints;
      
      // 获取现有优惠券
      let coupons = uni.getStorageSync('userCoupons') || [];
      
      // 创建新优惠券
      const newCoupon = {
        id: Date.now().toString(),
        type: couponType,
        points,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后过期
        used: false
      };
      
      // 添加新优惠券
      coupons.push(newCoupon);
      
      // 保存优惠券
      uni.setStorageSync('userCoupons', coupons);
      
      return {
        status: 'success',
        points,
        couponType,
        coupon: newCoupon,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error redeeming points locally:', error);
      throw error;
    }
  }

  /**
   * 断开钱包连接
   */
  disconnect() {
    uniWeb3.disconnect();
    this.isConnected = false;
    this.userAddress = '';
    console.log('Wallet disconnected');
  }
}

// 导出单例实例
const blockchainService = new BlockchainService();
export default blockchainService;
