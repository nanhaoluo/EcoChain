package com.ecochain.app;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.Image;
import android.media.ImageReader;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;
import android.util.Size;
import android.view.Surface;
import android.view.TextureView;

import androidx.annotation.NonNull;

import java.nio.ByteBuffer;
import java.util.Arrays;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * AR相机视图组件
 * 用于捕获相机预览帧并进行AR处理
 */
public class ArCameraView extends TextureView implements TextureView.SurfaceTextureListener {
    private static final String TAG = "ArCameraView";
    
    private Context mContext;
    private CameraDevice mCameraDevice;
    private CameraCaptureSession mCaptureSession;
    private CaptureRequest.Builder mPreviewRequestBuilder;
    private ImageReader mImageReader;
    private Size mPreviewSize;
    private HandlerThread mBackgroundThread;
    private Handler mBackgroundHandler;
    private Semaphore mCameraOpenCloseLock = new Semaphore(1);
    private int mSensorOrientation;
    private boolean mFlashSupported;
    private String mCameraId;
    
    // 帧处理回调
    private FrameProcessCallback mFrameProcessCallback;
    
    /**
     * 帧处理回调接口
     */
    public interface FrameProcessCallback {
        void onFrameAvailable(byte[] data, int width, int height, int format);
    }
    
    public ArCameraView(Context context) {
        super(context);
        mContext = context;
        setSurfaceTextureListener(this);
    }
    
    /**
     * 设置帧处理回调
     */
    public void setFrameProcessCallback(FrameProcessCallback callback) {
        mFrameProcessCallback = callback;
    }
    
    /**
     * 启动相机预览
     */
    public void startCamera() {
        startBackgroundThread();
        
        if (isAvailable()) {
            openCamera(getWidth(), getHeight());
        }
    }
    
    /**
     * 停止相机预览
     */
    public void stopCamera() {
        closeCamera();
        stopBackgroundThread();
    }
    
    /**
     * 打开相机
     */
    private void openCamera(int width, int height) {
        CameraManager manager = (CameraManager) mContext.getSystemService(Context.CAMERA_SERVICE);
        try {
            if (!mCameraOpenCloseLock.tryAcquire(2500, TimeUnit.MILLISECONDS)) {
                throw new RuntimeException("Time out waiting to lock camera opening.");
            }
            
            // 选择后置相机
            for (String cameraId : manager.getCameraIdList()) {
                CameraCharacteristics characteristics = manager.getCameraCharacteristics(cameraId);
                Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);
                if (facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                    StreamConfigurationMap map = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
                    if (map == null) {
                        continue;
                    }
                    
                    // 选择合适的预览尺寸
                    mPreviewSize = new Size(640, 480); // 默认尺寸，实际应用中应该选择最合适的尺寸
                    
                    // 创建ImageReader用于处理预览帧
                    mImageReader = ImageReader.newInstance(mPreviewSize.getWidth(), mPreviewSize.getHeight(),
                            android.graphics.ImageFormat.YUV_420_888, 2);
                    mImageReader.setOnImageAvailableListener(mOnImageAvailableListener, mBackgroundHandler);
                    
                    // 获取传感器方向
                    mSensorOrientation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION);
                    
                    // 检查闪光灯是否支持
                    Boolean available = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                    mFlashSupported = available == null ? false : available;
                    
                    mCameraId = cameraId;
                    break;
                }
            }
            
            // 打开相机
            manager.openCamera(mCameraId, mStateCallback, mBackgroundHandler);
            
        } catch (CameraAccessException e) {
            Log.e(TAG, "Failed to open camera", e);
        } catch (InterruptedException e) {
            throw new RuntimeException("Interrupted while trying to lock camera opening.", e);
        }
    }
    
    /**
     * 关闭相机
     */
    private void closeCamera() {
        try {
            mCameraOpenCloseLock.acquire();
            if (mCaptureSession != null) {
                mCaptureSession.close();
                mCaptureSession = null;
            }
            if (mCameraDevice != null) {
                mCameraDevice.close();
                mCameraDevice = null;
            }
            if (mImageReader != null) {
                mImageReader.close();
                mImageReader = null;
            }
        } catch (InterruptedException e) {
            throw new RuntimeException("Interrupted while trying to lock camera closing.", e);
        } finally {
            mCameraOpenCloseLock.release();
        }
    }
    
    /**
     * 创建相机预览会话
     */
    private void createCameraPreviewSession() {
        try {
            SurfaceTexture texture = getSurfaceTexture();
            
            // 设置预览尺寸
            texture.setDefaultBufferSize(mPreviewSize.getWidth(), mPreviewSize.getHeight());
            
            // 创建预览Surface
            Surface previewSurface = new Surface(texture);
            
            // 创建预览请求
            mPreviewRequestBuilder = mCameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
            mPreviewRequestBuilder.addTarget(previewSurface);
            mPreviewRequestBuilder.addTarget(mImageReader.getSurface());
            
            // 创建预览会话
            mCameraDevice.createCaptureSession(Arrays.asList(previewSurface, mImageReader.getSurface()),
                    new CameraCaptureSession.StateCallback() {
                        @Override
                        public void onConfigured(@NonNull CameraCaptureSession cameraCaptureSession) {
                            if (mCameraDevice == null) {
                                return;
                            }
                            
                            mCaptureSession = cameraCaptureSession;
                            try {
                                // 自动对焦
                                mPreviewRequestBuilder.set(CaptureRequest.CONTROL_AF_MODE,
                                        CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
                                
                                // 开始预览
                                CaptureRequest previewRequest = mPreviewRequestBuilder.build();
                                mCaptureSession.setRepeatingRequest(previewRequest, null, mBackgroundHandler);
                            } catch (CameraAccessException e) {
                                Log.e(TAG, "Failed to set up camera preview", e);
                            }
                        }
                        
                        @Override
                        public void onConfigureFailed(@NonNull CameraCaptureSession cameraCaptureSession) {
                            Log.e(TAG, "Failed to configure camera preview session");
                        }
                    }, null);
        } catch (CameraAccessException e) {
            Log.e(TAG, "Failed to create camera preview session", e);
        }
    }
    
    /**
     * 相机状态回调
     */
    private final CameraDevice.StateCallback mStateCallback = new CameraDevice.StateCallback() {
        @Override
        public void onOpened(@NonNull CameraDevice cameraDevice) {
            mCameraOpenCloseLock.release();
            mCameraDevice = cameraDevice;
            createCameraPreviewSession();
        }
        
        @Override
        public void onDisconnected(@NonNull CameraDevice cameraDevice) {
            mCameraOpenCloseLock.release();
            cameraDevice.close();
            mCameraDevice = null;
        }
        
        @Override
        public void onError(@NonNull CameraDevice cameraDevice, int error) {
            mCameraOpenCloseLock.release();
            cameraDevice.close();
            mCameraDevice = null;
        }
    };
    
    /**
     * 图像可用回调
     */
    private final ImageReader.OnImageAvailableListener mOnImageAvailableListener = new ImageReader.OnImageAvailableListener() {
        @Override
        public void onImageAvailable(ImageReader reader) {
            Image image = null;
            try {
                image = reader.acquireLatestImage();
                if (image == null) {
                    return;
                }
                
                if (mFrameProcessCallback != null) {
                    ByteBuffer buffer = image.getPlanes()[0].getBuffer();
                    byte[] data = new byte[buffer.remaining()];
                    buffer.get(data);
                    mFrameProcessCallback.onFrameAvailable(data, image.getWidth(), image.getHeight(), image.getFormat());
                }
            } finally {
                if (image != null) {
                    image.close();
                }
            }
        }
    };
    
    /**
     * 启动后台线程
     */
    private void startBackgroundThread() {
        mBackgroundThread = new HandlerThread("CameraBackground");
        mBackgroundThread.start();
        mBackgroundHandler = new Handler(mBackgroundThread.getLooper());
    }
    
    /**
     * 停止后台线程
     */
    private void stopBackgroundThread() {
        if (mBackgroundThread != null) {
            mBackgroundThread.quitSafely();
            try {
                mBackgroundThread.join();
                mBackgroundThread = null;
                mBackgroundHandler = null;
            } catch (InterruptedException e) {
                Log.e(TAG, "Failed to stop background thread", e);
            }
        }
    }
    
    @Override
    public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
        openCamera(width, height);
    }
    
    @Override
    public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
        // 处理预览尺寸变化
    }
    
    @Override
    public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
        return true;
    }
    
    @Override
    public void onSurfaceTextureUpdated(SurfaceTexture surface) {
        // 预览更新
    }
}
