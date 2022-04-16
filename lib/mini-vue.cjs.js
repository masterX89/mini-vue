'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const NOOP = () => { };
const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isArray = (val) => Array.isArray(val);
const isOn = (val) => /^on[A-Z]/.test(val);
// tips: in vs. hasOwnProperty
//                       | in  | hasOwnProperty
// Symbol                | yes |     yes
// inherited properties  | yes |     no
// ES6 getters/setters   | yes |     no
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// target -> key -> dep -> effect 实例
const targetMap = new Map();
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

// 1. 拿到 onEvent
// 2. onEvent && onEvent()
function emit(instance, event) {
    // 在子组件实例的 props 中应该存在 onEvent 事件
    const { props } = instance;
    console.log('componentEmit: ', event);
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
        console.warn(`${key} is not in the component`);
        return 'undefined';
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
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
        // setup 接收 props 参数
        const setupResult = setup(shallowReadonly(props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
}
// 1. setupResult 是 function
// 2. setupResult 是 object
// 3. finishComponentSetup
function handleSetupResult(instance, setupResult) {
    // TODO: function
    // TODO: object 响应式代理
    // instance.setupState = proxyRefs(setupResult)
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
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

function render(vnode, rootContainer) {
    // patch 递归
    patch(vnode, rootContainer);
}
function patch(vnode, container) {
    const { type, shapeFlag } = vnode;
    switch (type) {
        case 'Fragment':
            processFragment(vnode, container);
            break;
        default:
            // TODO: vnode 不合法就没有出口了
            if (shapeFlag & 1 /* ELEMENT */) {
                // isString -> processElement
                processElement(vnode, container);
            }
            else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                // isObj ->processComponent
                processComponent(vnode, container);
            }
            break;
    }
}
function processElement(vnode, container) {
    // 判断是 mount 还是 update
    mountElement(vnode, container);
    // TODO: updateElement
}
// 1. 创建 type === tag 的 el
// 2. el.props 是 attribute 还是 event
// 3. children 是否为 string 或者 array
// 4. 挂载 container.append
function mountElement(vnode, container) {
    const { type, props, children, shapeFlag } = vnode;
    // 这里的 vnode 是 tag, 通过 vnode.el 把 el 传递出来
    const el = (vnode.el = document.createElement(type));
    if (props) {
        for (const key in props) {
            const val = props[key];
            if (isOn(key)) {
                const event = key.substring(2).toLowerCase();
                el.addEventListener(event, val);
            }
            else {
                el.setAttribute(key, val);
            }
        }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        el.innerText = children;
    }
    else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
    }
    container.append(el);
}
function mountChildren(children, container) {
    children.forEach((child) => {
        patch(child, container);
    });
}
function processComponent(vnode, container) {
    // 判断是 mount 还是 update
    mountComponent(vnode, container);
    // TODO: updateComponent
}
function mountComponent(initialVNode, container) {
    // 1. 创建 componentInstance
    // 数据类型: vnode -> component
    // component: {vnode, type}
    const instance = createComponentInstance(initialVNode);
    // 2. setupComponent(instance)
    setupComponent(instance);
    // 3. setupRenderEffect(instance)
    // 此时 instance 通过 setupComponent 拿到了 render
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    // setupState | $el | $data 的代理
    const { proxy } = instance;
    // render 的 this 指向的是 proxy
    // proxy 读取 setup 返回值的时通过 handler 处理掉了 setupState
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // 递归结束, subTree 是 root element, 即最外层的 tag
    // 而这个方法里的 vnode 是一个 componentInstance
    // vnode.el = subTree.el 将 el 传递给了 component
    initialVNode.el = subTree.el;
}
function processFragment(vnode, container) {
    const { children } = vnode;
    mountChildren(children, container);
}

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
    else if (Array(children)) {
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

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 1. 创建 vnode: rootComponent -> vnode
            // vnode: {type, props?, children?}
            const vnode = createVNode(rootComponent);
            // 2. 渲染 vnode: render(vnode, rootContainer)
            render(vnode, convertContainer(rootContainer));
        },
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
            return createVNode('Fragment', {}, slot(props));
        }
    }
}

exports.createApp = createApp;
exports.h = h;
exports.renderSlot = renderSlot;
