import { track, trigger } from './effect'
import { ReactiveFlags } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly: boolean = false) {
  // 两个出口
  return function (target, key) {
    // IS_REACTIVE| IS_READONLY
    // 判断是否为内部的属性，进行拦截
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    // 普通响应式数据的逻辑
    const res = Reflect.get(target, key)
    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
}

function createSetter() {
  return function (target, key, value) {
    const res = Reflect.set(target, key, value)
    trigger(target, key)
    return res
  }
}

export const mutableHandlers = {
  get: get,
  set: set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `fail to set key "${String(key)}", because target is readonly: `,
      target
    )
    return true
  },
}
