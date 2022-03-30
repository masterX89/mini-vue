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
    this._fn()
  }
}

// target -> key -> dep
const targetMap = new Map()
export function track(target, key) {
  // 核心是 targetMap -> depsMap -> dep -> dep.add
  // 两个 if 用于 init
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  if (activeEffect) {
    // 注意不要让 undefined 进入 dep
    dep.add(activeEffect)
  }
}

export function trigger(target, key) {
  // trigger 是在 set 阶段，即响应式对象的内容发生了变化，所以理论上 dep 应该存在
  let depsMap = targetMap.get(target)
  let dep = depsMap.get(key)
  for (const effect of dep) {
    effect.run()
  }
}

let activeEffect
export function effect(fn) {
  // 使用 _effect 实例化对象来处理逻辑
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
