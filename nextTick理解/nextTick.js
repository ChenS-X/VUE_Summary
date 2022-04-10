// 原型上定义的方法
Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
};
// 构造函数上定义的方法
Vue.nextTick = nextTick;

// 实际的定义
var callbacks = [];
function nextTick(cb, ctx) {
    var _resolve;
    // callbacks是维护微任务的数组。
    callbacks.push(function () {
        if (cb) {
            try {
                cb.call(ctx);
            } catch (e) {
                handleError(e, ctx, 'nextTick');
            }
        } else if (_resolve) {
            _resolve(ctx);
        }
    });
    if (!pending) {
        pending = true;
        // 将维护的队列推到微任务队列中维护
        timerFunc();
    }
    // nextTick没有传递参数，且浏览器支持Promise,则返回一个promise对象
    //如nextTick().then(() => {})
    if (!cb && typeof Promise !== 'undefined') {
        return new Promise(function (resolve) {
            _resolve = resolve;
        })
    }
}


export let isUsingMicroTask = false // 是否启用微任务开关
const callbacks = [] // 回调队列
let pending = false // 异步控制开关，标记是否正在执行回调函数

// 该方法负责执行队列中的全部回调
function flushCallbacks() {
    // 重置异步开关
    pending = false
    // 防止nextTick里有nextTick出现的问题
    // 所以执行之前先备份并清空回调队列
    const copies = callbacks.slice(0)
    callbacks.length = 0
    // 执行任务队列
    for (let i = 0; i < copies.length; i++) {
        copies[i]()
    }
}
let timerFunc // 用来执行保存的调用异步任务的方法
// 判断当前环境是否支持原生 Promise
if (typeof Promise !== 'undefined' && isNative(Promise)) {
    // 保存一个异步任务
    const p = Promise.resolve()
    timerFunc = () => {
        // 执行回调函数
        p.then(flushCallbacks)
        // ios 中可能会出现一个回调被推入微任务队列，但是队列没有刷新的情况
        // 所以用一个空的计时器来强制刷新任务队列
        if (isIOS) setTimeout(noop)
    }
    isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
    // 不支持 Promise 的话，在支持MutationObserver的非 IE 环境下
    // 如 PhantomJS, iOS7, Android 4.4
    let counter = 1
    const observer = new MutationObserver(flushCallbacks)
    const textNode = document.createTextNode(String(counter))
    observer.observe(textNode, {
        characterData: true
    })
    timerFunc = () => {
        counter = (counter + 1) % 2
        textNode.data = String(counter)
    }
    isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    // 使用setImmediate，虽然也是宏任务，但是比setTimeout更好
    timerFunc = () => {
        setImmediate(flushCallbacks)
    }
} else {
    // 以上都不支持的情况下，使用 setTimeout
    timerFunc = () => {
        setTimeout(flushCallbacks, 0)
    }
}


