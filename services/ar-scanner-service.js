/**
 * AR模块工具类
 * 提供AR扫描和识别功能
 */

// 导入TensorFlow Lite模块
import TensorFlowLiteManager from '../uni_modules/uts-tensorflow/index.uts';

class ARScannerService {
  // TensorFlow Lite管理器实例
  private tfLiteManager: TensorFlowLiteManager | null = null;
  
  // 模型是否已加载
  private modelLoaded: boolean = false;
  
  // 模型文件路径
  private modelPath: string = '/static/models/waste_classifier.tflite';
  
  // 分类标签
  private labels: string[] = ['塑料', '纸类', '金属', '玻璃', '有害垃圾', '厨余垃圾'];
  
  /**
   * 初始化AR扫描服务
   */
  async init(): Promise<boolean> {
    try {
      console.log('Initializing AR Scanner Service');
      
      // 创建TensorFlow Lite管理器实例
      this.tfLiteManager = new TensorFlowLiteManager();
      
      // 加载模型
      const result = await this.loadModel();
      
      return result;
    } catch (error) {
      console.error('Failed to initialize AR Scanner Service:', error);
      return false;
    }
  }
  
  /**
   * 加载TensorFlow Lite模型
   */
  async loadModel(): Promise<boolean> {
    try {
      if (!this.tfLiteManager) {
        throw new Error('TensorFlow Lite Manager not initialized');
      }
      
      console.log('Loading TensorFlow Lite model');
      
      // 加载模型
      const result = await this.tfLiteManager.loadModel(this.modelPath);
      this.modelLoaded = result;
      
      if (result) {
        console.log('Model loaded successfully');
      } else {
        console.error('Failed to load model');
      }
      
      return result;
    } catch (error) {
      console.error('Error loading model:', error);
      this.modelLoaded = false;
      return false;
    }
  }
  
  /**
   * 识别图像
   * @param imagePath 图像文件路径
   * @returns 识别结果，包含标签和概率
   */
  async recognizeImage(imagePath: string): Promise<{
    label: string;
    probability: number;
    recyclable: boolean;
    materialType: string;
    decompositionTime: string;
    recyclingMethod: string;
  }> {
    try {
      if (!this.tfLiteManager || !this.modelLoaded) {
        throw new Error('Model not loaded');
      }
      
      console.log('Recognizing image:', imagePath);
      
      // 执行图像分类
      const results = await this.tfLiteManager.classifyImage(imagePath);
      
      if (!results || results.length === 0) {
        throw new Error('No recognition results');
      }
      
      // 获取最高概率的结果
      const topResult = results[0];
      
      // 获取物品信息
      const itemInfo = this.getItemInfo(topResult.label);
      
      return {
        label: topResult.label,
        probability: topResult.probability,
        recyclable: itemInfo.recyclable,
        materialType: itemInfo.materialType,
        decompositionTime: itemInfo.decompositionTime,
        recyclingMethod: itemInfo.recyclingMethod
      };
    } catch (error) {
      console.error('Error recognizing image:', error);
      throw error;
    }
  }
  
  /**
   * 获取物品信息
   * @param label 物品标签
   * @returns 物品信息
   */
  private getItemInfo(label: string): {
    recyclable: boolean;
    materialType: string;
    decompositionTime: string;
    recyclingMethod: string;
  } {
    // 根据标签返回物品信息
    switch (label) {
      case '塑料':
        return {
          recyclable: true,
          materialType: '塑料',
          decompositionTime: '450-1000年',
          recyclingMethod: '清洗干净，压扁，投放到可回收物垃圾桶'
        };
      case '纸类':
        return {
          recyclable: true,
          materialType: '纸质材料',
          decompositionTime: '2-5个月',
          recyclingMethod: '保持干燥，折叠，投放到可回收物垃圾桶'
        };
      case '金属':
        return {
          recyclable: true,
          materialType: '金属材料',
          decompositionTime: '50-500年',
          recyclingMethod: '清洗干净，压扁（如果可能），投放到可回收物垃圾桶'
        };
      case '玻璃':
        return {
          recyclable: true,
          materialType: '玻璃材料',
          decompositionTime: '数百万年',
          recyclingMethod: '清洗干净，小心处理避免破碎，投放到可回收物垃圾桶'
        };
      case '有害垃圾':
        return {
          recyclable: false,
          materialType: '有害物质',
          decompositionTime: '不确定',
          recyclingMethod: '单独投放到有害垃圾收集点'
        };
      case '厨余垃圾':
        return {
          recyclable: true,
          materialType: '有机物',
          decompositionTime: '1-6个月',
          recyclingMethod: '沥干水分，投放到厨余垃圾桶'
        };
      default:
        return {
          recyclable: false,
          materialType: '未知',
          decompositionTime: '未知',
          recyclingMethod: '请咨询专业人士'
        };
    }
  }
  
  /**
   * 释放资源
   */
  dispose(): void {
    if (this.tfLiteManager) {
      this.tfLiteManager.dispose();
      this.tfLiteManager = null;
      this.modelLoaded = false;
      console.log('AR Scanner Service resources released');
    }
  }
}

// 导出单例实例
const arScannerService = new ARScannerService();
export default arScannerService;
