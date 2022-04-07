import { hasChanged, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

// dep
class RefImpl {
  private _value: any
  private _rawValue: any
  public readonly __v_isRef = true
  dep: Set<unknown>
  constructor(value) {
    // 保存原始值，便于后续比较
    this._rawValue = value
    this._value = convert(value)
    this.dep = new Set()
  }

  get value(): any {
    // 依赖收集
    trackRefValue(this)
    return this._value
  }

  set value(newValue: any) {
    // 合理触发依赖
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
      this._value = convert(newValue)
      // 依赖触发
      triggerRefValue(this)
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

function triggerRefValue(ref) {
  triggerEffects(ref.dep)
}

function convert(value) {
  // 判断 原始值 还是 引用 进行转换
  return isObject(value) ? reactive(value) : value
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(ref) {
  return !!ref.__v_isRef
}

export function unRef(ref) {
  return isRef(ref) ? ref._value : ref
}

export function proxyRefs(objectWithRefs) {
  // TODO: proxyRefs handler
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key))
    },
    set(target, key, newVal) {
      const oldVal = target[key]
      // newVal is not Ref && oldVal is Ref
      if (!isRef(newVal) && isRef(oldVal)) {
        oldVal.value = newVal
        return true
      } else {
        return Reflect.set(target, key, newVal)
      }
    },
  })
}
