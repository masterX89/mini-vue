import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandler'

export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers)
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers)
}

function createReactiveObject(raw, baseHandles) {
  return new Proxy(raw, baseHandles)
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}

export function isReactive(value): boolean {
  // 如果使用字面量字符串传递，则是魔数
  return !!value[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(value): boolean {
  return !!value[ReactiveFlags.IS_READONLY]
}
