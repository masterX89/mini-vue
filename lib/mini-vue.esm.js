const NOOP = () => { };
const extend = Object.assign;
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
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: NOOP,
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

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    function render(vnode, rootContainer) {
        // patch 递归
        patch(null, vnode, rootContainer, null);
    }
    function patch(n1, n2, container, parentComponent) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // TODO: vnode 不合法就没有出口了
                if (shapeFlag & 1 /* ELEMENT */) {
                    // isString -> processElement
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                    // isObj ->processComponent
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        const { children } = n2;
        mountChildren(children, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        // TODO: 这里使用了 DOM 平台，需要抽离逻辑
        const el = (n2.el = document.createTextNode(children));
        container.append(el);
    }
    function processElement(n1, n2, container, parentComponent) {
        // 判断是 mount 还是 update
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    // 1. 创建 type === tag 的 el
    // 2. el.props 是 attribute 还是 event
    // 3. children 是否为 string 或者 array
    // 4. 挂载 container.append
    function mountElement(vnode, container, parentComponent) {
        const { type, props, children, shapeFlag } = vnode;
        // 这里的 vnode 是 tag, 通过 vnode.el 把 el 传递出来
        const el = (vnode.el = hostCreateElement(type));
        if (props) {
            for (const key in props) {
                const val = props[key];
                hostPatchProp(el, key, val);
            }
        }
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            el.innerText = children;
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(children, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((child) => {
            patch(null, child, container, parentComponent);
        });
    }
    function patchElement(n1, n2, container) {
        // TODO: patchElement
        // props
        // children
        console.log('patchElement');
        console.log('n1: ', n1);
        console.log('n2: ', n2);
    }
    function processComponent(n1, n2, container, parentComponent) {
        // 判断是 mount 还是 update
        mountComponent(n2, container, parentComponent);
        // TODO: updateComponent
    }
    function mountComponent(initialVNode, container, parentComponent) {
        // 1. 创建 componentInstance
        // 数据类型: vnode -> component
        // component: {vnode, type}
        const instance = createComponentInstance(initialVNode, parentComponent);
        // 2. setupComponent(instance)
        setupComponent(instance);
        // 3. setupRenderEffect(instance)
        // 此时 instance 通过 setupComponent 拿到了 render
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            // mount 流程
            if (!instance.isMounted) {
                // setupState | $el | $data 的代理
                const { proxy } = instance;
                // render 的 this 指向的是 proxy
                // proxy 读取 setup 返回值的时通过 handler 处理掉了 setupState
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                // 递归结束, subTree 是 root element, 即最外层的 tag
                // 而这个方法里的 vnode 是一个 componentInstance
                // vnode.el = subTree.el 将 el 传递给了 component
                initialVNode.el = subTree.el;
                // 更新 isMounted 状态
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                // 更新 instance 的 subTree
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance);
                // XXX: update 流程中 el 是否会被更新？
                // initialVNode.el = subTree.el
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    if (isOn(key)) {
        const event = key.substring(2).toLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, container) {
    container.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, ref, renderSlot };
