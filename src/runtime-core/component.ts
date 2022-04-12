import { shallowReadonly } from '../reactivity/reactive'
import { isObject, NOOP } from '../shared'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  }
  // bind 除了可以处理 this 丢失的问题
  // 还可以隐藏参数
  // XXX: as any 需要在 ts 的学习中解决
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance: any) {
  const { props } = instance.vnode
  // 将 props 接收到 instance 中
  // instance.vnode.props -> instance.props
  initProps(instance, props)
  // TODO: initSlots
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
    // setup 接收 props 参数
    const setupResult = setup(shallowReadonly(props), { emit: instance.emit })
    handleSetupResult(instance, setupResult)
  }
}

// 1. setupResult 是 function
// 2. setupResult 是 object
// 3. finishComponentSetup
function handleSetupResult(instance, setupResult: any) {
  // TODO: function

  // TODO: object 响应式代理
  // instance.setupState = proxyRefs(setupResult)
  if (isObject(setupResult)) {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}
function finishComponentSetup(instance: any) {
  const Component = instance.type

  // 如果 instance 还没有 render
  if (!instance.render) {
    instance.render = Component.render
  }
}
