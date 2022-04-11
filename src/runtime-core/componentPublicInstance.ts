import { hasOwn } from '../shared'

// key -> function(instance)
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance
    // 类似 this.count
    // 需要检查 count 是 setupResult 里的，还是 props 里的
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    }

    // 类似 this.$el
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
