<template>
	<div class="components">
		<div class="tabs">
			<div class="tabs-item"
				v-for="(value, key) in tabs"
				:key="key"
				:class="[currentTab === value ? 'active' : '']"
				@click="switchTab(key)"
			>
				{{value}}
			</div>
		</div>
		<div class="main">
			<!-- component组件。使用is绑定要显示的组件，这里使用一个计算属性dynimicComponent -->
			<keep-alive>
				<component :is="dynimicComponent"></component>
			</keep-alive>
		</div>
	</div>
</template>
<script>

	import { defineAsyncComponent } from 'vue';

	import Intro from './Intro';

	/** 
	 * defineAsyncComponent定义异步组件，参数为一个返回promise对象的函数，刚好import返回的就是promise对象
	 * 在需要使用的时候，去服务器请求异步组件，然后插入使用
	 * */ 
	const List = defineAsyncComponent(() => import('./List'))
	const Article = defineAsyncComponent(() => import('./Article'));
	
	export default {
		name: 'ComponentTabs',
		components: {
			Intro,
		},
		data() {
			return {
				currentTab : 'Intro',
				tabs: {
					'intro': 'Intro',
					'list': 'List',
					'article': 'Article'
				}
			}
		},
		methods: {
			switchTab(key) {
				switch(key) {
					case 'intro':
						this.currentTab = 'Intro';
						break;
					case 'list':
						this.currentTab = 'List';
						break;
					case 'article':
						this.currentTab = 'Article'
					default:
						break;
				}
			}
		},
		computed: {
			dynimicComponent() {
				const obj = {
					'Intro': Intro,
					'List': List,
					'Article': Article
				}
				// console.log(this);
				return obj[this.currentTab];
			}
		}
	}
</script>

<style>
	.components{
		width: 500px;
		height: 500px;
		border: 2px solid #333;
		margin:  10px auto;
	}
	.tabs{
		width: 100%;
		height: 66px;
		display: flex;
		align-items: center;
		border-bottom: 1px solid #333;
	}
	.tabs-item{
		width: 33.33%;
		/*height: 100%;*/
		height:  66px;
		line-height: 66px;
		text-align: center;
	}
	.tabs-item.active{
		background: #000;
		color: #fff;
	}
</style>