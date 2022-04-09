function Vue(options) {
    this.options = options;
    this.data = typeof options.data === 'function' ? options.data() : options.data;
    this.el = options.el;
    var self = this;
    // 在vm上代理data的数据，让外面，包括下面的访问能直接 vm[属性名]的方式，而不需要 vm.data[属性名]
    Object.keys(this.data).forEach(function(key) {
        self._proxy(key);
    });

    // 劫持数据
    observe(this.data);

    // 编译html，找到对应的指令v-和对应被引用的data属性，然后新建watcher绑定属性和订阅者
    this.$compile = new Compile(options.el || document.body, this);
}

Vue.prototype = {
    _proxy: function(key) {
        var self = this;
        Object.defineProperty(self, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return self.data[key];
            },
            set: function proxySetter(newValue) {
                self.data[key] = newValue;
            }
        });
    }
}


function observe(data) {
    if (typeof data !== 'object' || typeof data === null) return;

    Object.keys(data).forEach(k => {
        if (Object.prototype.hasOwnProperty.call(data, k)) {
            defineReactive(data, k, data[k]);
        }
    });
}

function defineReactive(target, key, value) {
    // 新建一个属性收集器实例对象
    var dep = new Dep();
    observe(value);
    Object.defineProperty(target, key, {
        enumerable: true,
        configurable: false,
        get() {
            if (Dep.target) {
                dep.addSub(Dep.target);
            }
            return value;
        },
        set(newVal) {
            value = newVal;
            dep.notify();
        }
    })
}

// 依赖收集器
function Dep() {
    // 这里存在优化的地方
    this.subs = [];
}

Dep.prototype.addSub = function(sub) {
    this.subs.push(sub);
}
Dep.prototype.notify = function() {
    this.subs.forEach(sub => sub.update())
}


// 订阅者watcher
function Watcher(vm, exp, cb) {
    this.vm = vm;
    this.exp = exp;
    this.cb = cb;
    this.value;
    this.get(exp);
}
Watcher.prototype.update = function() {
    // this.cb(newValue, oldValue);
    this.cb(this.vm[this.exp], this.value);
    // 给oldValue赋值，这里会调用到属性的getter访问器，但是因为此时Dep.target == null
    // 所以不会有影响
    this.value = this.wm[this.exp];
}

// 在get函数中更新this.value
Watcher.prototype.get = function(exp) {
    Dep.target = this;
    this.value = this.vm[exp];
    Dep.target = null;
}


function Compile(el, vm) {
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    this.$vm = vm;
    if (this.$el) {
        // 利用文档碎片，复制一份el
        this.$fragment = this.node2Fragment(this.$el);
        // 操作文档碎片
        this.init();
        // 将新的文档碎片append到el上
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    init: function() {
        this.compileElement(this.$fragment);
    },
    node2Fragment: function() {
        var fragment = document.createDocumentFragment(),
            child;
        /*
            while(child = el.firstChild)
            这个语句进行了2个操作：

            执行赋值操作child = el.firstChild
            执行while(child)，while是条件为真的情况下才执行，也就是必须el.firstChild有值的情况下才执行
            appendChild 方法具有可移动性

            当判定while(child)为真的情况执行fragment.appendChild(child);

            把el.firstChild即el.children[0]抽出插入到fragment。注意这个操作是move dom， el.children[0]被抽出，在下次while循环执行firstChild = el.firstChild时读取的是相对本次循环的el.children[1]以此达到循环转移dom的目的。

            fragment.appendChild()具有移动性
            相当于把el中节点移动过去
        */
        while (child = this.$el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    },
    compileElement: function(el) {
        var childNodes = el.childNodes,
            self = this;
        [].slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/; // 双花括号表达式
            // 按元素节点方式编译
            if (self.isElementNode(node)) {
                self.compile(node);
            } else if (self.isTextNode(node) && reg.test(text)) {
                self.compileText(node, RegExp.$1);
            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);
            }
        })
    },
    compile: function(node) {
        var nodeAttrs = node.attributes,
            self = this;
        [].slice.call(nodeAttrs).forEach(function(attr) {
            // 规定：指令以v-xxx命名
            // 如<span v-text="content"></span>中指令为v-text
            let attrName = attr.name;
            if (self.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2); // text
                if (self.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, self.$vm, exp, dir);
                } else {
                    let dirs = dir.split(':');
                    compileUtil[dirs[0]] && compileUtil[dirs[0]](node, self.$vm, exp, dir);
                }
            }
        });
    },
    compileText: function(node, exp) {
        compileUtil['text'](node, this.$vm, exp);
    },
    isElementNode: function(node) {
        return node.nodeType == 1;
    },
    isDirective: function(attrName) {
        return /^v-/.test(attrName);
    },
    isEventDirective: function(dir) {
        return /^on\:/.test(dir);
    },
    isTextNode: function(node) {
        return node.nodeType == 3;
    }
}

var compileUtil = {
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    bind: function(node, vm, exp, dir) {
        // dir可能情况
        /**
         * text (v-text="xxxx")
         * bind:xxxx （v-bind:xxxx = 'xxxx'）
         * model (v-model="xxx")
         * html (v-html="xxxx")
         */
        let dirs = dir.split(':');
        if (dirs.length === 1) {
            var updateFn = updater[dir + 'Updater'];
            updateFn && updateFn(node, vm[exp]);
            new Watcher(vm, exp, function(value, oldValue) {
                updateFn && updateFn(node, value, oldValue);
            });
        } else if (dirs.length === 2) {
            console.log(dirs);
            var updateFn = updater[dirs[0] + 'Updater'];
            updateFn && updateFn(node, vm[exp], null, dirs[1]);
            new Watcher(vm, exp, function(value, oldValue) {
                updateFn && updateFn(node, value, oldValue, dirs[1]);
            });
        }
    },
    model: function(node, vm, exp, dir) {
        if (node.value == null) {
            throw new Error('v-model directive must be used with input or textarea!');
        }
        this.bind(node, vm, exp, 'bind:value');
        node.addEventListener('input', function() {
            // console.log(this.value);
            vm[exp] = this.value;
        });
    },
    eventHandler: function(node, vm, exp, dir) {
        // 以v-on:click="sayHello"为例子：
        // 此处的exp为methods中对应的sayHello函数
        // 此处dir为 on:click
        console.log(arguments);
        let eventType = dir.split(':')[1];
        let method = vm.options.methods[exp];
        if (!method || typeof method !== 'function') {
            throw new Error(`${exp} must be a function which was defined in [Methods]!`);
        }
        if (eventType) {
            node.addEventListener(eventType, method.bind(vm));
        }
    }
}

var updater = {
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    bindUpdater: function(node, value, oldvalue, property) {
        node[property] = value;
    },
    htmlUpdater: function(node, value, oldvalue) {
        node.innerHTML = value;
    }
}