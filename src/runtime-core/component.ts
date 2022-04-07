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
// 2. instance.setupState 判断是否有 setup -> setupResult
// 3. instance.render 判断是否有 setup -> setupResult -> render
function setupStatefulComponent(instance: any) {
  // 代理模式, 使用 proxy
  instance.proxy = new Proxy(instance, {
    // TODO: component handler
    get(instance, key) {
      const { setupState } = instance
      if (key in setupState) {
        // 不使用 if 的话，类似 $el 等也会走这个分支
        return setupState[key]
      }
      if (key === '$el') {
        return instance.vnode.el
      }
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
