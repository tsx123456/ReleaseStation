<template>
	<view v-if="visible" class="loading-wrapper">
		<view class="loading-mask"></view>
		<view class="loading-content">
			<view class="spinner"></view>
			<text class="loading-text">{{ text }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			text: {
				type: String,
				default: "加载中..."
			}
		}
	}
</script>

<style>
	.loading-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
	}

	.loading-mask {
		position: absolute;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.3);
	}

	.loading-content {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #fff;
		padding: 20px;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #409EFF;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 10px;
	}

	.loading-text {
		font-size: 14px;
		color: #333;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>