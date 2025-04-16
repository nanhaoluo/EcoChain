package com.ecochain.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.support.common.FileUtil;
import org.tensorflow.lite.support.common.TensorOperator;
import org.tensorflow.lite.support.common.TensorProcessor;
import org.tensorflow.lite.support.common.ops.NormalizeOp;
import org.tensorflow.lite.support.image.ImageProcessor;
import org.tensorflow.lite.support.image.TensorImage;
import org.tensorflow.lite.support.image.ops.ResizeOp;
import org.tensorflow.lite.support.image.ops.ResizeWithCropOrPadOp;
import org.tensorflow.lite.support.label.TensorLabel;
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer;

import java.io.IOException;
import java.nio.MappedByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * TensorFlow Lite 模型推理实现
 * 用于垃圾分类识别
 */
public class TFLite {
    private static final String TAG = "TFLite";
    
    // 模型配置
    private static final float IMAGE_MEAN = 127.5f;
    private static final float IMAGE_STD = 127.5f;
    private static final int IMAGE_SIZE_X = 224;
    private static final int IMAGE_SIZE_Y = 224;
    
    // 分类标签
    private static final String[] LABELS = {
        "塑料", "纸类", "金属", "玻璃", "有害垃圾", "厨余垃圾"
    };
    
    private Interpreter tflite;
    private MappedByteBuffer tfliteModel;
    private TensorImage inputImageBuffer;
    private TensorBuffer outputProbabilityBuffer;
    private TensorProcessor probabilityProcessor;
    
    private List<String> labels;
    private int imageSizeX;
    private int imageSizeY;
    
    /**
     * 初始化TFLite模型
     * @param context 应用上下文
     * @param modelPath 模型文件路径
     */
    public void init(Context context, String modelPath) {
        try {
            // 加载模型
            tfliteModel = FileUtil.loadMappedFile(context, modelPath);
            Interpreter.Options options = new Interpreter.Options();
            options.setNumThreads(4); // 设置线程数
            tflite = new Interpreter(tfliteModel, options);
            
            // 设置输入图像缓冲区
            int[] inputShape = tflite.getInputTensor(0).shape();
            imageSizeX = inputShape[1];
            imageSizeY = inputShape[2];
            int imageTensorIndex = 0;
            int[] imageShape = tflite.getInputTensor(imageTensorIndex).shape();
            int imageTensorSize = imageShape[0] * imageShape[1] * imageShape[2] * imageShape[3];
            inputImageBuffer = new TensorImage(tflite.getInputTensor(imageTensorIndex).dataType());
            
            // 设置输出概率缓冲区
            int probabilityTensorIndex = 0;
            int[] probabilityShape = tflite.getOutputTensor(probabilityTensorIndex).shape();
            int probabilityTensorSize = probabilityShape[0] * probabilityShape[1];
            outputProbabilityBuffer = TensorBuffer.createFixedSize(probabilityShape, tflite.getOutputTensor(probabilityTensorIndex).dataType());
            
            // 设置归一化处理器
            TensorOperator normOp = new NormalizeOp(IMAGE_MEAN, IMAGE_STD);
            probabilityProcessor = new TensorProcessor.Builder().add(normOp).build();
            
            // 设置标签
            labels = new ArrayList<>();
            Collections.addAll(labels, LABELS);
            
            Log.d(TAG, "TFLite model initialized successfully");
        } catch (IOException e) {
            Log.e(TAG, "Failed to initialize TFLite model", e);
        }
    }
    
    /**
     * 对图像进行分类
     * @param bitmap 输入图像
     * @return 分类结果，包含标签和概率
     */
    public Map<String, Float> classify(Bitmap bitmap) {
        if (tflite == null) {
            Log.e(TAG, "TFLite model not initialized");
            return new HashMap<>();
        }
        
        // 预处理图像
        inputImageBuffer = loadImage(bitmap);
        
        // 运行推理
        tflite.run(inputImageBuffer.getBuffer(), outputProbabilityBuffer.getBuffer().rewind());
        
        // 获取结果
        Map<String, Float> labeledProbability = new TensorLabel(labels, probabilityProcessor.process(outputProbabilityBuffer)).getMapWithFloatValue();
        
        return labeledProbability;
    }
    
    /**
     * 加载并预处理图像
     * @param bitmap 输入图像
     * @return 处理后的TensorImage
     */
    private TensorImage loadImage(Bitmap bitmap) {
        // 加载图像
        inputImageBuffer.load(bitmap);
        
        // 创建图像处理器
        ImageProcessor imageProcessor = new ImageProcessor.Builder()
            .add(new ResizeWithCropOrPadOp(
                Math.min(bitmap.getWidth(), bitmap.getHeight()),
                Math.min(bitmap.getWidth(), bitmap.getHeight())))
            .add(new ResizeOp(imageSizeX, imageSizeY, ResizeOp.ResizeMethod.BILINEAR))
            .add(new NormalizeOp(IMAGE_MEAN, IMAGE_STD))
            .build();
        
        // 处理图像
        return imageProcessor.process(inputImageBuffer);
    }
    
    /**
     * 从文件加载图像
     * @param imagePath 图像文件路径
     * @return Bitmap对象
     */
    public Bitmap loadImageFromFile(String imagePath) {
        try {
            return BitmapFactory.decodeFile(imagePath);
        } catch (Exception e) {
            Log.e(TAG, "Failed to load image from file", e);
            return null;
        }
    }
    
    /**
     * 关闭TFLite解释器
     */
    public void close() {
        if (tflite != null) {
            tflite.close();
            tflite = null;
        }
        tfliteModel = null;
    }
}
