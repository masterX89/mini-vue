export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
  }
  return component
}

export function setupComponent(instance: any) {
  // TODO: initProps
  // TODO: initSlots
  setupStatefulComponent(instance)
  // TODO: 函数组件(无状态)
}

// 1. instance.proxy
// 2. setup?
// 3. handleSetupResult
function setupStatefulComponent(instance: any) {
  // 处理 instance 中 this 的指向
  instance.proxy = new Proxy(instance, {
    // TODO: component handler
    get(target, key) {
      const { setupState } = target
      return setupState[key]
    },
  })
  // instance -> vnode -> type === component -> setupResult = setup()
  // instance: {vnode, type}
  // instance -> type === component -> setupResult = setup()
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    const setupResult = setup()
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
  instance.setupState = setupResult

  finishComponentSetup(instance)
}
function finishComponentSetup(instance: any) {
  const Component = instance.type

  // 如果 instance 还没有 render
  if (!instance.render) {
    instance.render = Component.render
  }
}
