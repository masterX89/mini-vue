import { hasChanged, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

// dep
class RefImpl {
  private _value: any
  private _rawValue: any
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
