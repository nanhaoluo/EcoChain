/**
 * AR相机控制器
 * 用于管理相机预览和帧处理
 */

// 导入AR扫描服务
import arScannerService from '../../services/ar-scanner-service.js';

export default {
  data() {
    return {
      // 相机配置
      cameraConfig: {
        devicePosition: 'back', // 后置摄像头
        flash: 'off',
        frameSize: 'medium' // 帧大小
      },
      
      // 扫描状态
      scanning: false,
      
      // 识别结果
      recognitionResult: null,
      
      // 临时图片路径
      tempImagePath: '',
      
      // 定时器ID
      scanTimerId: null,
      
      // 是否显示结果
      showResult: false,
      
      // 是否初始化完成
      initialized: false,
      
      // 初始化错误
      initError: null,
      
      // 扫描间隔（毫秒）
      scanInterval: 3000,
      
      // 相机上下文
      cameraContext: null
    };
  },
  
  onLoad() {
    // 初始化AR扫描服务
    this.initARScanner();
  },
  
  onUnload() {
    // 清除定时器
    this.clearScanTimer();
    
    // 释放资源
    arScannerService.dispose();
  },
  
  methods: {
    /**
     * 初始化AR扫描服务
     */
    async initARScanner() {
      try {
        // 显示加载提示
        uni.showLoading({
          title: '初始化中...'
        });
        
        // 初始化AR扫描服务
        const result = await arScannerService.init();
        
        if (result) {
          this.initialized = true;
          console.log('AR Scanner initialized successfully');
        } else {
          this.initError = '初始化失败，请重试';
          console.error('Failed to initialize AR Scanner');
        }
        
        // 隐藏加载提示
        uni.hideLoading();
      } catch (error) {
        console.error('Error initializing AR Scanner:', error);
        this.initError = '初始化出错：' + error.message;
        uni.hideLoading();
      }
    },
    
    /**
     * 相机准备就绪
     */
    onCameraReady(e) {
      console.log('Camera ready');
      
      // 获取相机上下文
      this.cameraContext = uni.createCameraContext();
    },
    
    /**
     * 相机错误
     */
    onCameraError(e) {
      console.error('Camera error:', e.detail);
      uni.showToast({
        title: '相机启动失败，请检查权限',
        icon: 'none'
      });
    },
    
    /**
     * 开始扫描
     */
    startScanning() {
      if (!this.initialized) {
        uni.showToast({
          title: '系统未初始化完成',
          icon: 'none'
        });
        return;
      }
      
      if (this.scanning) {
        return;
      }
      
      this.scanning = true;
      this.showResult = false;
      this.recognitionResult = null;
      
      // 设置定时器，定期拍照并识别
      this.scanTimerId = setInterval(() => {
        this.takePhotoAndRecognize();
      }, this.scanInterval);
      
      // 立即执行一次拍照识别
      this.takePhotoAndRecognize();
      
      console.log('Scanning started');
    },
    
    /**
     * 停止扫描
     */
    stopScanning() {
      this.clearScanTimer();
      this.scanning = false;
      console.log('Scanning stopped');
    },
    
    /**
     * 清除扫描定时器
     */
    clearScanTimer() {
      if (this.scanTimerId) {
        clearInterval(this.scanTimerId);
        this.scanTimerId = null;
      }
    },
    
    /**
     * 拍照并识别
     */
    takePhotoAndRecognize() {
      if (!this.cameraContext) {
        console.error('Camera context not available');
        return;
      }
      
      // 拍照
      this.cameraContext.takePhoto({
        quality: 'normal',
        success: (res) => {
          console.log('Photo taken:', res.tempImagePath);
          this.tempImagePath = res.tempImagePath;
          
          // 识别图像
          this.recognizeImage(res.tempImagePath);
        },
        fail: (err) => {
          console.error('Failed to take photo:', err);
          uni.showToast({
            title: '拍照失败',
            icon: 'none'
          });
        }
      });
    },
    
    /**
     * 识别图像
     */
    async recognizeImage(imagePath) {
      try {
        // 显示加载提示
        uni.showLoading({
          title: '识别中...'
        });
        
        // 识别图像
        const result = await arScannerService.recognizeImage(imagePath);
        
        // 隐藏加载提示
        uni.hideLoading();
        
        // 检查结果可信度
        if (result.probability < 0.6) {
          console.log('Low confidence result, continue scanning');
          return;
        }
        
        // 停止扫描
        this.stopScanning();
        
        // 显示结果
        this.recognitionResult = result;
        this.showResult = true;
        
        console.log('Recognition result:', result);
        
        // 触发结果事件
        this.$emit('recognition-result', result);
      } catch (error) {
        console.error('Error recognizing image:', error);
        uni.hideLoading();
        uni.showToast({
          title: '识别失败：' + error.message,
          icon: 'none'
        });
      }
    },
    
    /**
     * 重新扫描
     */
    rescan() {
      this.showResult = false;
      this.recognitionResult = null;
      this.startScanning();
    },
    
    /**
     * 从相册选择图片
     */
    chooseFromAlbum() {
      uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          console.log('Image selected from album:', tempFilePath);
          this.tempImagePath = tempFilePath;
          
          // 识别图像
          this.recognizeImage(tempFilePath);
        },
        fail: (err) => {
          console.error('Failed to choose image:', err);
        }
      });
    },
    
    /**
     * 确认结果
     */
    confirmResult() {
      if (!this.recognitionResult) {
        return;
      }
      
      // 触发确认事件
      this.$emit('confirm-result', {
        result: this.recognitionResult,
        imagePath: this.tempImagePath
      });
    }
  }
};
