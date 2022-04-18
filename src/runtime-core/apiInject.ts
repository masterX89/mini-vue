import { isFunction } from '../shared'
import { getCurrentInstance } from './component'

export function provide(key, value) {
  const currentInstance: any = getCurrentInstance()
  let provides = currentInstance.provides
  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides
  // init
  if (parentProvides === provides) {
    provides = currentInstance.provides = Object.create(parentProvides)
  }
  provides[key] = value
}

export function inject(key, defaultValue) {
  // TODO: not self-inject
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides
    // XXX: 为什么使用 in 而不是 hasOwn
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      return isFunction(defaultValue) ? defaultValue() : defaultValue
    }
  }
}
