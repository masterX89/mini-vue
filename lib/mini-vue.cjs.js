'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => val !== null && typeof val === 'object';
const isString = (val) => typeof val === 'string';
const isArray = (val) => Array.isArray(val);

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // TODO: initProps
    // TODO: initSlots
    setupStatefulComponent(instance);
    // TODO: 函数组件(无状态)
}
// 1. instance.proxy
// 2. setup?
// 3. handleSetupResult
function setupStatefulComponent(instance) {
    // 处理 instance 中 this 的指向
    instance.proxy = new Proxy(instance, {
        // TODO: component handler
        get(target, key) {
            const { setupState } = target;
            return setupState[key];
        },
    });
    // instance -> vnode -> type === component -> setupResult = setup()
    // instance: {vnode, type}
    // instance -> type === component -> setupResult = setup()
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
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
    instance.setupState = setupResult;
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
    const { type } = vnode;
    if (isString(type)) {
        // isString -> processElement
        processElement(vnode, container);
    }
    else if (isObject(type)) {
        // isObj ->processComponent
        processComponent(vnode, container);
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
    const { type, props, children } = vnode;
    const el = document.createElement(type);
    if (props) {
        for (const key in props) {
            el.setAttribute(key, props[key]);
            // TODO: event
        }
    }
    if (isString(children)) {
        el.innerText = children;
    }
    else if (isArray(children)) {
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
function mountComponent(vnode, container) {
    // 1. 创建 componentInstance
    // 数据类型: vnode -> component
    // component: {vnode, type}
    const instance = createComponentInstance(vnode);
    // 2. setupComponent(instance)
    setupComponent(instance);
    // 3. setupRenderEffect(instance)
    // 此时 instance 通过 setupComponent 拿到了 render
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    // setupState | $el | $data 的代理
    const { proxy } = instance;
    // render 的 this 指向的是 proxy
    // proxy 读取 setup 返回值的时通过 handler 处理掉了 setupState
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
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

exports.createApp = createApp;
exports.h = h;
