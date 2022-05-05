const extend = Object.assign;
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const isObject = (val) => val !== null && typeof val === 'object';
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isArray = (val) => Array.isArray(val);
const isOn = (val) => /^on[A-Z]/.test(val);
// NaN 算作变更
const hasChanged = (newVal, oldVal) => !Object.is(newVal, oldVal);
// tips: in vs. hasOwnProperty
//                       | in  | hasOwnProperty
// Symbol                | yes |     yes
// inherited properties  | yes |     no
// ES6 getters/setters   | yes |     no
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        component: null,
        key: props && props.key,
        children,
        shapeFlag: getShapeFlag(type),
    };
    if (isString(children)) {
        vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
    }
    else if (isArray(children)) {
        vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
    }
    // 如何判断是一个 slots
    // vnode是一个组件 且 children 是 object
    if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
        if (isObject(vnode.children)) {
            vnode.shapeFlag |= 32 /* SLOTS_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return isString(type) ? 1 /* ELEMENT */ : 4 /* STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlot(slots, name = 'default', props) {
    // TODO: default 具名
    const slot = slots[name];
    if (slot) {
        // slot: (props) => h(el, {}, props)
        if (isFunction(slot)) {
            // 需要使用 Fragment
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

// target -> key -> dep -> effect 实例
const targetMap = new Map();
// activeEffect 保存了激活的 effect，便于在 track 的时候使用
let activeEffect;
// 在 run 函数中开关，在 track 中进行判断
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = []; // 反向依赖的数据结构
        this.active = true; // active 标识位
        this._fn = fn;
        // effect(fn, options?) 存在两个参数且内部使用了 extend(_effect,options)
        // 所以 _effect 可从 options 中拿到 scheduler
        // 而 computed(getter) 只有一个参数，内部只 new constructor
        // 所以必须在 constructor 这里接受两个参数，并传给实例的 scheduler
        this.scheduler = scheduler;
    }
    run() {
        // 手动执行 runner 的分支
        if (!this.active) {
            // 为什么不 activeEffect = this？理由可能是手动执行意味着 activeEffect 当前并非是 this
            // 其实后续 activeEffect 会变为 栈 结构以便于 effect 嵌套执行
            return this._fn();
        }
        // 响应式触发
        shouldTrack = true;
        // activeEffect 保存的是实例化对象
        activeEffect = this;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        // 如果用户多次调用 stop，即使已经 cleanup 过，effect 实际不存在于 dep中了
        // 但是 cleanupEffect 依旧会执行循环
        // 性能优化：使用 active 标识位
        if (this.active) {
            cleanupEffect(this);
            // onStop 的回调函数
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    // 负责通过反向依赖把 effectFn 从依赖收集的 Set 中解除
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // 清空 deps
    effect.deps.length = 0;
}
// 1. 边界判断
// 2. 找到 dep: targetMap -> depsMap -> dep
// 3. 依赖收集
function track(target, key) {
    // 边界判断
    if (!isTracking())
        return;
    // 核心是 targetMap -> depsMap -> dep -> dep.add
    // 两个 if 用于 init
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    // 依赖收集
    trackEffects(dep);
}
function isTracking() {
    // 边界，注意不要让 undefined 进入 dep
    // 边界，!shouldTrack 时直接返回
    return shouldTrack && activeEffect !== undefined;
}
function trackEffects(dep) {
    // 常见于 wrapped.foo = 2, set 后还会执行一次 get
    // 而此时的 effect 已经在 dep 中了，其实对于 Set 来说无所谓
    // 但是 deps 就很吃力了，因为它是个 Array 并不判重，会持续增长
    // 到了 cleanup 的部分，就会多出来很多性能消耗
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // 反向依赖收集
    activeEffect.deps.push(dep);
}
// 1. 找到 dep
// 2. 触发依赖
function trigger(target, key) {
    // 需要对 depsMap 和 dep 是否存在做出判断
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    dep &&
        dep.forEach((effect) => {
            if (effect.scheduler) {
                effect.scheduler();
            }
            else {
                effect.run();
            }
        });
}
// 1. 实例化对象
// 2. 接受 options
// 3. 执行 effectFn
// 4. return runner
function effect(fn, options = {}) {
    // 使用 _effect 实例化对象来处理逻辑
    const _effect = new ReactiveEffect(fn);
    // 接收 options
    extend(_effect, options);
    // 通过实例执行
    _effect.run();
    const runner = _effect.run.bind(_effect);
    // 返回前保存当前的 effect
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallow = false) {
    // 两个出口
    return function (target, key) {
        // IS_REACTIVE| IS_READONLY
        // 判断是否为内部的属性，进行拦截
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        // 普通响应式数据的逻辑
        const res = Reflect.get(target, key);
        // XXX: isShallow 直接返回 res，不判断深响应和深只读。但是 track 是否应该执行？
        if (isShallow) {
            return res;
        }
        // 深响应 && 深只读
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get: get,
    set: set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`fail to set key "${String(key)}", because target is readonly: `, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(raw, baseHandles) {
    return new Proxy(raw, baseHandles);
}

// dep
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 保存原始值，便于后续比较
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 依赖收集
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 合理触发依赖
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            // 依赖触发
            triggerRefValue(this);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function triggerRefValue(ref) {
    triggerEffects(ref.dep);
}
function convert(value) {
    // 判断 原始值 还是 引用 进行转换
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    // unRef 主要就是为了暴露给 proxyRefs 使用的
    // 读取到值的内容的时候，会触发 unRef
    // 而 unRef 里应该触发 .value 而不是 ._value
    // 否则不能触发依赖收集
    return isRef(ref) ? ref.value : ref;
}
// proxyRefs 用于包装一个 obj(一般为 setupResult)
// setupResult 可能为这种形式
// {
//   ref(原始值)
//   reactive(obj) 写个测试用例测试一下
//   function
//   原始值
// }
function proxyRefs(objectWithRefs) {
    // TODO: proxyRefs handler
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newVal) {
            const oldVal = target[key];
            // newVal is not Ref && oldVal is Ref
            if (!isRef(newVal) && isRef(oldVal)) {
                oldVal.value = newVal;
                return true;
            }
            else {
                return Reflect.set(target, key, newVal);
            }
        },
    });
}

// 1. 拿到 onEvent
// 2. onEvent && onEvent()
function emit(instance, event) {
    // 在子组件实例的 props 中应该存在 onEvent 事件
    const { props } = instance;
    const toHandleKey = (str) => (str ? `on${capitalize(event)}` : '');
    const handleName = toHandleKey(event);
    const handler = props[handleName];
    handler && handler();
}

function initProps(instance, rawProps) {
    // instance.vnode.props 可能为 props 或者 undefined -> {}
    instance.props = rawProps || {};
    // TODO: attrs
}

// key -> function(instance)
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        // 类似 this.count
        // 需要检查 count 是 setupResult 里的，还是 props 里的
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // 类似 this.$el
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // TODO: 不在 setupState | props | $ 中，需要做处理
    },
};

function initSlots(instance, children) {
    // 判断 children 是否是一个 object
    // 判断任务加入到 shapeFlags 中
    const { vnode } = instance;
    if (vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // value 或者说 slot 此时是一个 function
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
// 需要判断 children 是 single element 还是 数组
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        next: null,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: null,
        update: null,
    };
    // bind 除了可以处理 this 丢失的问题
    // 还可以隐藏参数
    // XXX: as any 需要在 ts 的学习中解决
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    const { props, children } = instance.vnode;
    // 将 props 接收到 instance 中
    // instance.vnode.props -> instance.props
    initProps(instance, props);
    initSlots(instance, children);
    setupStatefulComponent(instance);
    // TODO: 函数组件(无状态)
}
// 1. instance.proxy
// 2. instance.setupState 判断是否有 setup -> setupResult
// 3. instance.render 判断是否有 setup -> setupResult -> render
function setupStatefulComponent(instance) {
    // 代理模式, 使用 proxy
    // 这里的解构是为了保持源码一致，源码后续第一个参数会是 instance.ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    // instance -> vnode -> type === component -> setupResult = setup()
    // instance: {vnode, type}
    // instance -> type === component -> setupResult = setup()
    const { props, type: Component } = instance;
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // setup 接收 props 参数
        const setupResult = setup(shallowReadonly(props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
// 1. setupResult 是 function
// 2. setupResult 是 object
// 3. finishComponentSetup
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (isObject(setupResult)) {
        // render 中要拿到自动脱 ref 所以使用 proxyRefs 包装 setupResult 的内容
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 如果 instance 还没有 render
    if (!instance.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    // init
    if (parentProvides === provides) {
        provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
}
function inject(key, defaultValue) {
    // TODO: not self-inject
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        // XXX: 为什么使用 in 而不是 hasOwn
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            return isFunction(defaultValue) ? defaultValue() : defaultValue;
        }
    }
}

function hasPropsChanged(prevProps, nextProps) {
    const nextKeys = Object.keys(nextProps);
    if (Object.keys(prevProps).length !== nextKeys.length) {
        return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 1. 创建 vnode: rootComponent -> vnode
                // vnode: {type, props?, children?}
                const vnode = createVNode(rootComponent);
                // 2. 渲染 vnode: render(vnode, rootContainer)
                render(vnode, convertContainer(rootContainer));
            },
        };
    };
}
function convertContainer(container) {
    if (isString(container)) {
        const result = document.querySelector(container);
        return result;
    }
    else {
        // TODO: 考虑 container 为空，需要 document.createElement('div')
        return container;
    }
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    Promise.resolve().then(() => {
        // 如果在这里有 log 的话会发现 then 执行了 循环的次数
        // 是因为微任务队列塞进了 循环次数 的 promise
        // 第一次 queue 有内容, 但是后面的 queue 是空
        // 所以创建如此多的 promise 是没有必要的
        // 开关重新初始化
        isFlushPending = false;
        let job;
        while ((job = queue.shift())) {
            job && job();
        }
    });
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, rootContainer) {
        // patch 递归
        patch(null, vnode, rootContainer, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // TODO: vnode 不合法就没有出口了
                if (shapeFlag & 1 /* ELEMENT */) {
                    // isString -> processElement
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                    // isObj ->processComponent
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        const { children } = n2;
        mountChildren(children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        // TODO: 这里使用了 DOM 平台，需要抽离逻辑
        const el = (n2.el = document.createTextNode(children));
        container.append(el);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 判断是 mount 还是 update
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    // 1. 创建 type === tag 的 el
    // 2. el.props 是 attribute 还是 event
    // 3. children 是否为 string 或者 array
    // 4. 挂载 container.append
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type, props, children, shapeFlag } = vnode;
        // 这里的 vnode 是 tag, 通过 vnode.el 把 el 传递出来
        const el = (vnode.el = hostCreateElement(type));
        if (props) {
            for (const key in props) {
                const val = props[key];
                hostPatchProp(el, key, null, val);
            }
        }
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            el.innerText = children;
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(children, el, parentComponent, anchor);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((child) => {
            patch(null, child, container, parentComponent, anchor);
        });
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const el = (n2.el = n1.el);
        console.log('patchElement');
        console.log('n1: ', n1);
        console.log('n2: ', n2);
        // children
        // 注意这里传入的是 el 而不是 container
        // container 是整个容器
        // 此时更新的仅仅是需要更新节点的 el
        patchChildren(n1, n2, el, parentComponent, anchor);
        // props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        patchProps(el, oldProps, newProps);
    }
    // 此处的 container 是需要更新的容器 即 n1 n2 的 el
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                // remove all children
                unmountChildren(c1);
            }
            if (c1 !== c2) {
                // (ArrayToText | TextToText) -> insert text element
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
                // TextToArray
                // 清空 textContent
                hostSetElementText(container, null);
                // mountChildren
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // ArrayToArray
                patchKeyedChildren(c1, c2, container, parentComponent);
            }
        }
    }
    // 快速 diff
    function patchKeyedChildren(c1, c2, container, parentComponent) {
        // 双端预处理 => 步骤 1 和 2
        let i = 0;
        // 长度可能不同
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        // 记录 c2 长度
        const l2 = c2.length;
        // 1. sync from start
        // (a b) c
        // (a b) d e
        while (i <= e1 && i <= e2) {
            // 实则此处 while 的条件是边界
            let n1 = c1[i];
            let n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, null);
            }
            else {
                // 当 n1 与 n2 不相等时为普通出口
                break;
            }
            i++;
        }
        // 2. sync from end
        // a (b c)
        // d e (b c)
        while (i <= e1 && i <= e2) {
            let n1 = c1[e1];
            let n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, null);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 预处理结束 理想状态下总有一个 children 处理完毕
        // 3. common sequence + mount
        // (a b)
        // (a b) c
        // i = 2, e1 = 1, e2 = 2
        // (a b)
        // c (a b)
        // i = 0, e1 = -1, e2 = 0
        // oldChildren 处理完毕 说明还有新的节点需要 mount
        // 特征是 i > oldEnd && i <= newEnd 而 [i,newEnd] 区间的内容即为 mount 内容
        if (i > e1) {
            if (i <= e2) {
                // mount
                while (i <= e2) {
                    // anchor index -> newEnd + 1
                    const anchorIndex = e2 + 1;
                    // anchorIndex < c2.length -> anchor 在 新的子节点中 -> c2[anchorIndex].el
                    // 否则 anchor -> null
                    const anchor = anchorIndex < l2 ? c2[anchorIndex].el : null;
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        // 4. common sequence + unmount
        // (a b) c
        // (a b)
        // i = 2, e1 = 2, e2 = 1
        // a (b c)
        // (b c)
        // i = 0, e1 = 0, e2 = -1
        // newChildren 处理完毕 说明还有旧的节点需要 unmount
        // 特征是 i > newEnd && i <= oldEnd 而 [i, oldEnd] 区间内容即为 unmount 内容
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        // 5. unknown sequence
        // [i ... e1 + 1]: a b [c d e] f g
        // [i ... e2 + 1]: a b [e d c h] f g
        // i = 2, e1 = 4, e2 = 5
        // 非理想状态要 LIS 找移动节点
        else {
            const s1 = i;
            const s2 = i;
            // 1. 先完成 patch 和 unmount 逻辑
            // 建立索引
            // 遍历 c1 的 [s1,e1] -> 在索引中找到 newIndex || 没有索引需要遍历寻找 O(n^2)
            // 如果 newIndex === undefined -> unmount
            // 否则 patch 并且记录 source 方便后面 LIS
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 当 patch >= toBePatched 时可以直接 unmount 并 continue
            let patched = 0;
            const toBePatched = e2 - s2 + 1;
            // source 数组 -> LIS
            // 0 代表新节点 offset = +1
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            // 判断是否存在需要移动的节点
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 当 patched >= toBePatched 时可以 unmount 并跳过
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // undefined || null
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 2. 然后再完成移动以及新增逻辑
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : EMPTY_ARR;
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 新增的节点
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    // 存在需要移动的节点
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // j < 0: LIS处理结束剩下的均为需要移动的节点
                        // i !== increasingNewIndexSequence[j]: 不在 LIS 中需要移动
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 不是新增的节点也无需移动
                        // LIS 的索引向前移动
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        // XXX: 这里为什么用 for 而不是 forEach
        // 并且vue3源码中的remove是把parentComponent也传递了过去
        // 按理来说传递后就不需要使用 Node.parentNode 来找 parent 了
        // 多次找 parentNode 也是一个消耗因为可能是同一个
        for (let i = 0; i < children.length; i++) {
            // 注意这里需要传入 el
            // children[i] 只是一个 vnode
            hostRemove(children[i].el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        // TODO: 关注 #5773 结果, 这个判断涉及到一个性能平衡点
        // 如果使用 hasPropsChanged 在 element 的 props 没有更新的情况下会节省一次循环
        // 但是同时会导致 props 更新的情况下多出一次循环
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (nextProp !== prevProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        const prevProp = oldProps[key];
                        hostPatchProp(el, key, prevProp, null);
                    }
                }
            }
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        // 将 n2 传递给 instance
        if (hasPropsChanged(n1.props, n2.props)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 1. 创建 componentInstance
        // 数据类型: vnode -> component
        // component: {vnode, type}
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // 2. setupComponent(instance)
        setupComponent(instance);
        // 3. setupRenderEffect(instance)
        // 此时 instance 通过 setupComponent 拿到了 render
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            // mount 流程
            if (!instance.isMounted) {
                // setupState | $el | $data 的代理
                const { proxy } = instance;
                // render 的 this 指向的是 proxy
                // proxy 读取 setup 返回值的时通过 handler 处理掉了 setupState
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anchor);
                // 递归结束, subTree 是 root element, 即最外层的 tag
                // 而这个方法里的 vnode 是一个 componentInstance
                // vnode.el = subTree.el 将 el 传递给了 component
                initialVNode.el = subTree.el;
                // 更新 isMounted 状态
                instance.isMounted = true;
            }
            else {
                const { proxy, vnode, next } = instance;
                // updateComponent 的逻辑
                // vnode: n1, next: n2
                if (next) {
                    // updateComponent 的 el 传递
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                // 更新 instance 的 subTree
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance, anchor);
                // update 流程中 el 是否会被更新？
                // 答案是会的, 在 patchElement 第一步就是 el = n2.el = n1.el
                // 但是注意这里是 element 更新逻辑里的 el
                // 而 Component 的 el 更新逻辑在上面的那个 if 判断里
                // 感觉这里写的不是很好 二者没有归一起来
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            },
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        // 传递  props
        instance.props = nextVNode.props;
        // 更新 instance 中的 vnode
        instance.vnode = nextVNode;
        nextVNode = null;
    }
    return {
        createApp: createAppAPI(render),
    };
}
// 注意 arrI 的 edge case:
// [2,0,1,3,4,5] 的 LIS index 是 [2,3,4,5]
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    if (isOn(key)) {
        const event = key.substring(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else if (nextVal === undefined || nextVal === null) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, nextVal);
    }
}
function insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
}
function remove(el) {
    const parentNode = el.parentNode;
    if (parentNode) {
        parentNode.removeChild(el);
    }
}
function setElementText(container, children) {
    // XXX: textContent v. innerText
    container.textContent = children;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, ref, renderSlot };
