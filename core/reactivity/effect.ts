// targetmap 保存了所有的响应式对象：target -> key -> depsMap
// activeEffect 保存了激活的 effect，便于在 track 的时候使用
class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
  }
  run() {
    // activeEffect 保存的是实例化对象
    activeEffect = this
    return this._fn()
  }
}

// target -> key -> dep
const targetMap = new Map()
export function track(target, key) {
  // 边界，注意不要让 undefined 进入 dep
  if (!activeEffect) return

  // 核心是 targetMap -> depsMap -> dep -> dep.add
  // 两个 if 用于 init
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  dep.add(activeEffect)
}

export function trigger(target, key) {
  // 需要对 depsMap 和 dep 是否存在做出判断
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  dep &&
    dep.forEach((effect) => {
      effect.run()
    })
}

let activeEffect
export function effect(fn) {
  // 使用 _effect 实例化对象来处理逻辑
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  return _effect.run.bind(_effect)
}
