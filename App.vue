<script>
	export default {
		onLaunch: function() {
			console.log('App Launch');
			// 初始化应用
			this.initApp();
		},
		onShow: function() {
			console.log('App Show');
		},
		onHide: function() {
			console.log('App Hide');
		},
		methods: {
			// 初始化应用
			initApp() {
				// 检查更新
				this.checkUpdate();
				
				// 预加载资源
				this.preloadResources();
				
				// 初始化用户状态
				this.initUserState();
			},
			
			// 检查应用更新
			checkUpdate() {
				// #ifdef APP-PLUS
				plus.runtime.getProperty(plus.runtime.appid, (widgetInfo) => {
					uni.request({
						url: 'https://api.ecochain.com/app/version',
						data: {
							version: widgetInfo.version,
							platform: uni.getSystemInfoSync().platform
						},
						success: (res) => {
							if (res.data && res.data.hasUpdate) {
								uni.showModal({
									title: '发现新版本',
									content: res.data.updateLog || '有新版本可用，是否立即更新？',
									success: (res) => {
										if (res.confirm) {
											// 打开下载页面
											plus.runtime.openURL(res.data.downloadUrl);
										}
									}
								});
							}
						}
					});
				});
				// #endif
			},
			
			// 预加载资源
			preloadResources() {
				// 预加载图片
				const preloadImages = [
					'/static/icons/camera.png',
					'/static/icons/realtime.png',
					'/static/icons/gallery.png',
					'/static/icons/location.png',
					'/static/icons/recycle-marker.png'
				];
				
				preloadImages.forEach(img => {
					uni.getImageInfo({
						src: img,
						fail: () => console.log('Failed to preload image:', img)
					});
				});
			},
			
			// 初始化用户状态
			initUserState() {
				// 获取存储的用户信息
				try {
					const userInfo = uni.getStorageSync('userInfo');
					if (userInfo) {
						this.globalData.userInfo = JSON.parse(userInfo);
						this.globalData.isLoggedIn = true;
					}
				} catch (e) {
					console.error('Failed to get user info from storage:', e);
				}
			}
		},
		globalData: {
			userInfo: null,
			isLoggedIn: false,
			appVersion: '1.0.0',
			baseUrl: 'https://api.ecochain.com',
			mapKey: 'YOUR_AMAP_API_KEY'
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
		background-color: #f5f5f5;
		color: #333;
		font-size: 14px;
		line-height: 1.5;
	}
	
	/* 主题颜色 */
	.primary-color {
		color: #4CAF50;
	}
	
	.primary-bg {
		background-color: #4CAF50;
	}
	
	.secondary-color {
		color: #2196F3;
	}
	
	.secondary-bg {
		background-color: #2196F3;
	}
	
	/* 通用布局 */
	.container {
		padding: 15px;
	}
	
	.flex-row {
		display: flex;
		flex-direction: row;
	}
	
	.flex-column {
		display: flex;
		flex-direction: column;
	}
	
	.flex-center {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.flex-between {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	/* 通用按钮 */
	.btn {
		height: 44px;
		line-height: 44px;
		border-radius: 22px;
		font-size: 16px;
		text-align: center;
	}
	
	.btn-primary {
		background-color: #4CAF50;
		color: #fff;
	}
	
	.btn-secondary {
		background-color: #2196F3;
		color: #fff;
	}
	
	.btn-outline {
		border: 1px solid #4CAF50;
		color: #4CAF50;
		background-color: transparent;
	}
	
	/* 通用卡片 */
	.card {
		background-color: #fff;
		border-radius: 10px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}
	
	/* 通用表单 */
	.form-item {
		margin-bottom: 15px;
	}
	
	.form-label {
		font-size: 14px;
		color: #666;
		margin-bottom: 5px;
	}
	
	.form-input {
		height: 44px;
		border: 1px solid #ddd;
		border-radius: 5px;
		padding: 0 15px;
		font-size: 14px;
	}
	
	/* 通用动画 */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.fade-in {
		animation: fadeIn 0.3s ease-in-out;
	}
	
	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.pulse {
		animation: pulse 1.5s infinite;
	}
</style>
