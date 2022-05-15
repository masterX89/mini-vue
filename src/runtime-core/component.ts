import { shallowReadonly } from '../reactivity/reactive'
import { proxyRefs } from '../reactivity/ref'
import { isObject, NOOP } from '../shared'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'

export function createComponentInstance(vnode: any, parent: any) {
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
  }
  // bind 除了可以处理 this 丢失的问题
  // 还可以隐藏参数
  // XXX: as any 需要在 ts 的学习中解决
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance: any) {
  const { props, children } = instance.vnode
  // 将 props 接收到 instance 中
  // instance.vnode.props -> instance.props
  initProps(instance, props)
  initSlots(instance, children)
  setupStatefulComponent(instance)
  // TODO: 函数组件(无状态)
}

// 1. instance.proxy
// 2. instance.setupState 判断是否有 setup -> setupResult
// 3. instance.render 判断是否有 setup -> setupResult -> render
function setupStatefulComponent(instance: any) {
  // 代理模式, 使用 proxy
  // 这里的解构是为了保持源码一致，源码后续第一个参数会是 instance.ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
  // instance -> vnode -> type === component -> setupResult = setup()
  // instance: {vnode, type}
  // instance -> type === component -> setupResult = setup()
  const { props, type: Component } = instance
  const { setup } = Component
  if (setup) {
    setCurrentInstance(instance)
    // setup 接收 props 参数
    const setupResult = setup(shallowReadonly(props), { emit: instance.emit })
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

// 1. setupResult 是 function
// 2. setupResult 是 object
// 3. finishComponentSetup
function handleSetupResult(instance, setupResult: any) {
  // TODO: function

  if (isObject(setupResult)) {
    // render 中要拿到自动脱 ref 所以使用 proxyRefs 包装 setupResult 的内容
    instance.setupState = proxyRefs(setupResult)
  }

  finishComponentSetup(instance)
}
function finishComponentSetup(instance: any) {
  const Component = instance.type

  // 如果 instance 还没有 render
  if (!instance.render) {
    if (compile && !Component.render) {
      const template = Component.template
      if (template) {
        Component.render = compile(template)
      }
    }
    instance.render = Component.render
  }
}

let currentInstance = null
export function getCurrentInstance() {
  return currentInstance
}

function setCurrentInstance(instance) {
  currentInstance = instance
}

let compile
export function registerRuntimeCompiler(_compiler) {
  compile = _compiler
}
