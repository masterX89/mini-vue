import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly: boolean = false) {
  return function (target, key) {
    if (!isReadonly) {
      track(target, key)
    }
    return Reflect.get(target, key)
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
