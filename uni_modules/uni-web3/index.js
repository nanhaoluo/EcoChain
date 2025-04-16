/**
 * Web3钱包连接封装
 * 提供区块链交互功能
 */

import Web3 from 'web3';
import contractABI from './lib/contract-abi.js';
import networkConfig from '../../common/web3/celo-config.js';

class UniWeb3 {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
    this.networkConfig = networkConfig;
  }

  /**
   * 初始化Web3
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init() {
    try {
      // 检查环境中是否有以太坊提供者
      if (window.ethereum) {
        console.log('Using injected web3 provider');
        this.web3 = new Web3(window.ethereum);
      } else {
        // 使用配置中的RPC URL
        console.log('Using RPC provider');
        const mumbaiRpcUrl = this.networkConfig.polygon.mumbai.rpcUrls[0];
        this.web3 = new Web3(new Web3.providers.HttpProvider(mumbaiRpcUrl));
      }

      console.log('Web3 initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      return false;
    }
  }

  /**
   * 连接钱包
   * @returns {Promise<string>} 连接的账户地址
   */
  async connectWallet() {
    try {
      if (!this.web3) {
        await this.init();
      }

      if (window.ethereum) {
        // 请求用户授权
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.account = accounts[0];
        
        // 获取当前链ID
        this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // 检查是否在正确的网络上
        if (this.chainId !== this.networkConfig.polygon.mumbai.chainId) {
          await this.switchToMumbaiNetwork();
        }
        
        this.isConnected = true;
        console.log('Wallet connected:', this.account);
        
        // 初始化合约
        this.initContract();
        
        // 设置账户变更监听
        window.ethereum.on('accountsChanged', (accounts) => {
          this.account = accounts[0];
          console.log('Account changed:', this.account);
        });
        
        // 设置链变更监听
        window.ethereum.on('chainChanged', (chainId) => {
          this.chainId = chainId;
          console.log('Chain changed:', this.chainId);
          window.location.reload();
        });
        
        return this.account;
      } else {
        throw new Error('No Ethereum provider found');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * 切换到Mumbai测试网
   */
  async switchToMumbaiNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.networkConfig.polygon.mumbai.chainId }],
      });
    } catch (switchError) {
      // 如果网络不存在，则添加网络
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: this.networkConfig.polygon.mumbai.chainId,
                chainName: this.networkConfig.polygon.mumbai.chainName,
                rpcUrls: this.networkConfig.polygon.mumbai.rpcUrls,
                nativeCurrency: this.networkConfig.polygon.mumbai.nativeCurrency,
                blockExplorerUrls: this.networkConfig.polygon.mumbai.blockExplorerUrls
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Mumbai network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to Mumbai network:', switchError);
        throw switchError;
      }
    }
  }

  /**
   * 初始化智能合约
   */
  initContract() {
    try {
      const contractAddress = this.networkConfig.contractAddress.mumbai;
      this.contract = new this.web3.eth.Contract(contractABI, contractAddress);
      console.log('Contract initialized:', contractAddress);
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      throw error;
    }
  }

  /**
   * 获取用户环保积分
   * @param {string} address 用户地址
   * @returns {Promise<number>} 环保积分
   */
  async getEcoPoints(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const userAddress = address || this.account;
      if (!userAddress) {
        throw new Error('No user address provided');
      }
      
      const points = await this.contract.methods.ecoPoints(userAddress).call();
      return parseInt(points);
    } catch (error) {
      console.error('Failed to get eco points:', error);
      throw error;
    }
  }

  /**
   * 获取用户回收次数
   * @param {string} address 用户地址
   * @returns {Promise<number>} 回收次数
   */
  async getRecycleCount(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const userAddress = address || this.account;
      if (!userAddress) {
        throw new Error('No user address provided');
      }
      
      const count = await this.contract.methods.recycleCount(userAddress).call();
      return parseInt(count);
    } catch (error) {
      console.error('Failed to get recycle count:', error);
      throw error;
    }
  }

  /**
   * 记录回收行为
   * @param {number} points 获得的积分
   * @returns {Promise<object>} 交易收据
   */
  async recordRecycle(points) {
    try {
      if (!this.contract || !this.account) {
        throw new Error('Contract or account not initialized');
      }
      
      // 使用Biconomy进行无Gas费交易
      if (this.networkConfig.gasless.enabled) {
        // 在实际应用中，这里会使用Biconomy SDK
        console.log('Using gasless transaction');
      }
      
      const receipt = await this.contract.methods.recordRecycle(this.account, points).send({
        from: this.account
      });
      
      console.log('Recycle recorded:', receipt);
      return receipt;
    } catch (error) {
      console.error('Failed to record recycle:', error);
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
      if (!this.contract || !this.account) {
        throw new Error('Contract or account not initialized');
      }
      
      const receipt = await this.contract.methods.redeemPoints(points, couponType).send({
        from: this.account
      });
      
      console.log('Points redeemed:', receipt);
      return receipt;
    } catch (error) {
      console.error('Failed to redeem points:', error);
      throw error;
    }
  }

  /**
   * 获取NFT元数据URI
   * @param {number} tokenId NFT的Token ID
   * @returns {Promise<string>} 元数据URI
   */
  async getNFTMetadataURI(tokenId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const uri = await this.contract.methods.uri(tokenId).call();
      return uri;
    } catch (error) {
      console.error('Failed to get NFT metadata URI:', error);
      throw error;
    }
  }

  /**
   * 获取NFT余额
   * @param {string} address 用户地址
   * @param {number} tokenId NFT的Token ID
   * @returns {Promise<number>} NFT余额
   */
  async getNFTBalance(address, tokenId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const userAddress = address || this.account;
      if (!userAddress) {
        throw new Error('No user address provided');
      }
      
      const balance = await this.contract.methods.balanceOf(userAddress, tokenId).call();
      return parseInt(balance);
    } catch (error) {
      console.error('Failed to get NFT balance:', error);
      throw error;
    }
  }

  /**
   * 断开钱包连接
   */
  disconnect() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
    console.log('Wallet disconnected');
  }
}

// 导出单例实例
const uniWeb3 = new UniWeb3();
export default uniWeb3;
