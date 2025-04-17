const config = {
  polygon: {
    mainnet: {
      chainId: "0x89",
      chainName: "Polygon Mainnet",
      rpcUrls: ["https://polygon-rpc.com/"],
      blockExplorerUrls: ["https://polygonscan.com/"],
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
    },
    mumbai: {
      chainId: "0x13881",
      chainName: "Polygon Mumbai Testnet",
      rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
      blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
    },
  },
  contractAddress: {
    mumbai: "0x1234567890123456789012345678901234567890", // 测试网合约地址
    mainnet: "", // 主网合约地址（暂未部署）
  },
  gasless: {
    enabled: true,
    biconomy: {
      apiKey: "YOUR_BICONOMY_API_KEY",
      apiId: "YOUR_BICONOMY_API_ID",
    },
  },
  ipfs: {
    gateway: "https://ipfs.io/ipfs/",
    pinata: {
      apiKey: "YOUR_PINATA_API_KEY",
      secretKey: "YOUR_PINATA_SECRET_KEY",
    },
  },
  nftStorage: {
    endpoint: "https://ecochain-nft.oss-cn-beijing.aliyuncs.com/metadata/",
  },
};

export default config;