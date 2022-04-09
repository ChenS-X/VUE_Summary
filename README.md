# Vue知识点总结

## 1.什么时MVVM
MVVM就是Model-View-ViewModel的缩写。Model代表数据模型，定义数据修改和逻辑操作，View代表UI组件，负责将数据转化成UI展示出来。ViewModel就是一个同步Model和View的对象。
在MVVM架构下，View和Model通过ViewModel进行交互。ViewModel通过双向数据绑定把View和Model链接起来。

## 2.mvvm和mvc区别？和其他框架（jQuery）的区别是什么？哪些场景适合？
mvc和mvvm区别不大。都是一种设计思想。主要就是把mvc中的Control演变成mvvm中的viewModel。mvvm主要解决mvc中大量的DOM操作使页面渲染性能降低，加载速度变慢，影响用户体验。
区别：vue数据驱动，通过数据来显示视图层而不是节点操作。
场景：数据操作比较多得场景，更加便捷。

## 3.组件间的传值
+ 父组件与子组件传值
    - 父组件通过标签上面定义值
    - 子组件通过props方法接收数据
+ 子组件向父组件传递数据
    - 子组件通过`$emit`方法传递参数

## 4.Vue的双向绑定原理
mvvm双向绑定，采用`数据劫持`结合发布者订阅者模式的方式，通过Object.defineProperty()来劫持各个属性的setter和getter，在数据变动时发布者发布消息给订阅者，触发相应的监听回调。（Vue3采用的Proxy代理的模式代理数据，和Object.defineProperty的方式不同的是，Proxy可以直接代理整个对象（或者单值），而不用递归）

* 几个要点：
    1. 实现一个数据监听器Observer，能够对数据对象的所有属性进行监听，如有变动可拿到最新的值并通知订阅者。
    2. 实现一个指令解析器Compile，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据以及绑定相应的更新函数
    3. 实现一个Watcher，作为连接Observer和Compile的桥梁，能够订阅并收到每个属性变动的通知，执行指令函数的相应对调函数，从而更新视图
    4. mvvm的入口函数，整合三者

* 具体实现步骤：
+ 需要observer的数据对象进行递归遍历，包括子属性的对象属性，都加上setter和getter，这样的话，给这个对象的某个值赋值，就会触发setter，那么就能监听到数据的变化了。
+ compile解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知更新视图。
+ Watcher订阅者是observer和compile的通信桥梁，主要做的事情就是在自身实例化的时候往属性订阅器（dep）中添加自己，自身必须有一个update()方法，待属性变动dep.notice()通知时，能调用自身的update方法，并触发compile中绑定的回调，则功成身退。
+ mvvm作为数据绑定的入口，整合observer、compile和watcher三者。通过observer来监听自己的model数据变化，通过compile来解析编译模板指令，最终利用watcher搭起observer和compile之间的通信桥梁，达到数据变化->视图更新；视图交互变化->数据model变更的双向绑定效果。

## 5.描述一下vue从初始化页面-修改数据-刷新页面UI的过程
当vue进入初始化阶段时，一方面vue会遍历data中的属性，并用Object.defineProperty将它转化程getter/setter的形式，实现数据劫持（vue3.0开始是使用的Proxy代理）；另一方面，vue的指令编译器Compiler对元素节点的各个指令进行解析，初始化试图，并订阅Watcher来更新视图，此时Watcher会将自己添加到消息订阅器Dep中，此时初始化完毕。
当数据发成变化时，出发Observer中的setter方法，立即调用Dep.notify()，Dep这个数组开始遍历所有的订阅者，并调用其update方法，vue内部再通过diff算法，patch相应的更新完成对订阅者视图的改变。

## 6.你是如何理解Vue的响应式系统？
+ 任何一个Vue Component都有一个与之对应的Watcher实例
+ Vue的data上的属性会被添加getter和setter属性
+ 当Vue Component render函数被执行的时候，data上被触碰，即被读，getter方法会被调用，此时Vue会去记录此Vue Component所依赖的所有data属性，这一过程被称为依赖收集
+ data被改动时，即被写，setter方法会被调用，此时vue会去通知所有依赖于此data的组件去调用他们的render函数进行更新

## 7.虚拟DOM实现原理
+ 虚拟DOM本质是Javascript对象，是对真实DOM的抽象
+ 状态变更时，记录新树和旧树的差异
+ 最后把差异更新到真正的DOM

## 8.Vue中key值的作用
当Vue.js用v-for正在更新已经渲染过的元素列表时，它默认使用“就地复用”的策略。如果数据项的顺序被改变了，Vue将不会移动DOM来匹配数据项的顺序，而是简单复用此处的每个元素，并确保它在特定索引下显示已被渲染过的每个元素。key的作用主要是为了高效地更新虚拟DOM。（在数据列表顺序改变时，key查找更新更加高效）

## 9.Vue的生命周期函数
**Vue2.0**总共分为8个阶段：创建前/后，载入前/后，更新前/后，销毁前/后。
+ 创建前后：
    + beforeCreate：在此阶段，vue实例的挂载元素el和数据对象data都为undefined，还未初始化。
    + created：在此阶段，vue实例对象的数据data有了，el还没有。
+ 载入前后：；
    + beforeMount：在此阶段，vue的实例的$el和data都初始化了，但是还是挂载之前为虚拟dom节点，data.message还未被替换。
    + mounted：在此阶段，vue实例挂载完成，data.message成功渲染。
+ 更新前后：
    + beforeUpdate：在此阶段，当data变化时，会触发beforeUpdate和updated方法
    + updated：在此阶段，当data变化时，会触发beforeUpdate和updated方法
+ 销毁前后：（beforeDestroy/destroyed）
    + 在执行destory方法后，对data的改变不会再触发周期函数，说明此时vue实例已经解除了事件监听以及dom的绑定，但是dom结构依然存在。

**Vue3.0** 将2.0中的beforeCreate和created合并到setup函数中，其余部分在原基础的前方加入“on”前缀，使用驼峰命名法：
+ beforeCreate -> setup
+ created      -> setup
+ beforeMount  -> onBeforeMount
+ mounted      -> onMounted
+ beforeUpdate -> onBeforeUpdate
+ updated      -> onUpdated
+ beforeDestroy-> onBeforeDestroy
+ destroyed    -> onDestroyed

**9.1 什么是生命周期函数**
Vue实例从创建到销毁的过程，就是生命周期，也就是从开始创建、初始化数据、编译模板、挂载DOM->渲染、更新->渲染、卸载等一系列过程，我们称之为生命周期。

**9.2 Vue生命周期的作用是什么**
它的生命周期中有多个事件钩子，让我们在控制整个Vue实例的过程时更容易形成好的逻辑

**9.3 第一次页面加载会触发哪几个钩子**
第一次页面加载时会触发beforeCreate、created、beforeMount、mounted这几个钩子

**9.4 DOM渲染在哪个周期中完成**
DOM渲染在mounted中就已经完成了

**9.5 简单描述每个周期具体适合哪些场景**
+ beforeCreate：可以在这个加上loading事件，在加载实例时触发
+ created：初始化完成时的事件写在这里，如在这结束loading事件，异步请求也适宜在这里调用
+ mounted：挂载元素，获取DOM节点
+ updated：如果对数据统一处理，在这里写上相应的函数
+ beforeDestroy：可以做一个确认停止事件的确认框，清除settimeout等
+ nextTick：更新数据后立即操作DOM（准确的说法是当更新数据，新数据作用到DOM节点上，此时DOM为新数据对应的DOM，操作新数据下的DOM节点）

## 10.Vue组件间通信有哪些方式
+ props/$emit
    - 父组件通过props，在标签上将参数传递给子组件；子组件通过$emit方式，调用其在标签上通过v-on(@)绑定的方法，然后将数据作为方法的参数传递给父组件
    ```html
    <!-- 父组件 -->
     <div>
         <Child :name="name" v-on:dataBackToParent="reciveDataFromChild"></Child>
     </div>
    ```
    ```js
        // 父组件部分代码
        import Child from 'xxx/Child.vue';

        new Vue({
            components: {
                Child,
            },
            data() {
                name: '张三'
            },
            methods: {
                reciveDataFromChild(data) {
                    console.log(data); // 这里的data就是子组件Child通过$emit(dataBackToParent)返回的数据
                }
            }
        });

        
        // 子组件js部分代码
        new Vue({
            ...
            props: {
                name: {
                    type: String, // 类型
                    value: '', // 默认值
                }
            },
            mounted() {
                ...
                this.$emit('dataBackToParent', {age: 18});
            }
        });


        // Vue3.0的props和emit，在setup函数中以参数的形式
        setup(props, { emit }) {
            // 这里的props就是父组件传递过来的参数，
            // emit('事件名称', 数据)
        }
    ```
+ $emit/$on
+ vuex
+ $attr/$listener
+ provide/inject
+ $parent/$child与ref

## 11.Vue3中的ref


## 12.Vue中怎么重置data
使用Object.assign()，vm.$data可以获取当前状态下的data，vm.$options.data(this)可以获取到组件初始状态下的data。
```js
Object.assign(this.$data, this.$options.data(this)) // 注意加this
```

## 13.组件中写name选项有什么用
+ 项目使用keep-alive时，可搭配组件name进行缓存
```html
    <template>
        <keep-alive>
            <!-- 这里表示home组件会被缓存 -->
            <router-view include="home"/>    
        <keep-alive>
    </template>
```
+ DOM做递归组件时需要调用自身的name
    - 此处展示一个例子：注意，利用name属性，使用条件编译v-if，设置好限制条件，不能无限递归
    ```vue
    <!--menu组件-->
    <template>
        <ul>
            <li v-for="(item, index) in listData">
                <span @click="handle(item)">{{item.title}}</span>
                <v-menu :listData="item.children" v-if="item.children" v-show="item.flag"></v-menu>
            </li>
        </ul>
    </template>
    <script>
        import VMenu from './VMenu';
        export.default {
            name: 'VMenu',
            components: {
                VMenu,
            },
            props: ['listData'],
            methods: {
                handle(item) {
                    return item.flag = !item.flag
                }
            }
        }
    </script>
    ```
    ```vue
    <!--父组件-->
    <template>
        <div id="app">
            <v-menu :listData="listData"></v-menu>
        </div>
    </template>
    <script>
        import VMenu from './VMenu';
        export.default {
            components: {
                VMenu,
            },
            data() {
                return {
                    listData: [
                        {
                            title: '一级菜单',
                            flag: true,
                            children: [
                                {
                                    title: '二级菜单',
                                    flag: true,
                                    children: [
                                        {
                                            title: '三级菜单'
                                        }
                                    ]
                                },
                                {
                                    title: '二级菜单'
                                },{
                                    title: '二级菜单'
                                }
                            ]
                        },
                        {
                            title: '一级菜单',
                            children: [
                                {
                                    title: '二级菜单',
                                    flag: true
                                }
                            ]
                        },
                        {
                            title: '一级菜单'
                        }
                    ]
                }
            }
        }
    </script>
    ```
    - 展示效果，可折叠
    
    ![image text](/images/menu.png)

+ vue-devtools调试工具里显示的组件名称有vue中组件name决定

## 14.keep-alive的原理和作用
`keep-alive`是vue内置的一个组件。当我们想对某个不想频繁刷新的组件。
一般情况下，当进行组件切换时，会默认的销毁上一个组件，然后再展示下一个组件的。如果有需求某个组件切换后不进行销毁的话，这个时候就会用到`keep-alive`来实现了。
假设：当前有Home和About两个组件，希望缓存Home组件
```html
<!-- App组件 -->
<template>
    <div id="app">
        <div id="nav">
            <router-link to="/">Home</router-link>
            <router-link to="/about">About</router-link>
        </div>
        <keep-alive>
            <router-view />
        </keep-alive>
    </div>
</template>
```
这样写完之后，Home和About组件都会被缓存下来。不符合需求

**方法一：** 可以利用`keep-alive`中的`include`和`exclude`匹配组件
+ include：字符串或正则表达式。只有名称匹配的组件会被缓存
+ exclude：字符串或正则表达式。任何名称匹配的组件都不会被缓存。
```html
<!--用逗号分隔字符串，匹配到a或者b都会被缓存-->
<keep-alive include="a,b">
    <router-view />
</keep-alive>

<!--正则表达式-->
<keep-alive include="/a|b/">
    <router-view />
</keep-alive>

<!--数组，可以配合v-bind使用-->
<keep-alive :include="['a', 'b']">
    <router-view />
</keep-alive>
```

回到刚才的例子中，如果想要Home组件匹配到，则需要改变App组件写法
```html
<!-- include匹配Home组件 -->
<template>
    <div id="app">
        <div id="nav">
            <router-link to="/">Home</router-link>
            <router-link to="/about">About</router-link>
        </div>
        <keep-alive include="home">
            <router-view />
        </keep-alive>
    </div>
</template>
```

**方法二：** 利用路由规则中的meta添加keepAlive属性为true，也就是当前路由组件要进行缓存。结合v-if使用，当meta中的keepAlive为true进行缓存，否则不缓存，这样更灵活一些。
```js
// 路由对象
{
    path: '/home',
    name: 'home',
    meta: {
        keepAlive: true
    },
    component: Home
}
```
```html
<keep-alive>
    <router-view v-if="$route.meta.keepAlive" />
</keep-alive>
<router-view v-if="!$route.meta.keepAlive" />
```

**注意：** 被keep-alive缓存的组件，当切换时，因为没有被销毁，所以组件在切换时不会调用`created`等生命周期函数。这时，可以使用`actived`和`deactived`来获取当前组件是否处于活动状态。