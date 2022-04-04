import { extend } from '../shared'

// target -> key -> dep -> effect 实例
const targetMap = new Map()
// activeEffect 保存了激活的 effect，便于在 track 的时候使用
let activeEffect
// 在 run 函数中开关，在 track 中进行判断
let shouldTrack

class ReactiveEffect {
  private _fn: any // effectFn
  public scheduler: Function | undefined
  deps = [] // 反向依赖的数据结构
  active: boolean = true // active 标识位
  onStop?: () => void
  constructor(fn) {
    this._fn = fn
  }
  run() {
    // 手动执行 runner 的分支
    if (!this.active) {
      // 为什么不 activeEffect = this？理由可能是手动执行意味着 activeEffect 当前并非是 this
      // 其实后续 activeEffect 会变为 栈 结构以便于 effect 嵌套执行
      return this._fn()
    }
    // 响应式触发
    shouldTrack = true
    // activeEffect 保存的是实例化对象
    activeEffect = this
    const result = this._fn()
    shouldTrack = false
    return result
  }
  stop() {
    // 如果用户多次调用 stop，即使已经 cleanup 过，effect 实际不存在于 dep中了
    // 但是 cleanupEffect 依旧会执行循环
    // 性能优化：使用 active 标识位
    if (this.active) {
      cleanupEffect(this)
      // onStop 的回调函数
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanupEffect(effect) {
  // 负责通过反向依赖把 effectFn 从依赖收集的 Set 中解除
  effect.deps.forEach((dep) => {
    dep.delete(effect)
  })
  // 清空 deps
  effect.deps.length = 0
}

// 1. 边界判断
// 2. 找到 dep: targetMap -> depsMap -> dep
// 3. 依赖收集
export function track(target, key) {
  // 边界判断
  if (!isTracking()) return

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

  // 常见于 wrapped.foo = 2, set 后还会执行一次 get
  // 而此时的 effect 已经在 dep 中了，其实对于 Set 来说无所谓
  // 但是 deps 就很吃力了，因为它是个 Array 并不判重，会持续增长
  // 到了 cleanup 的部分，就会多出来很多性能消耗
  if (dep.has(activeEffect)) return
  dep.add(activeEffect)
  // 反向依赖收集
  activeEffect.deps.push(dep)
}

function isTracking() {
  // 边界，注意不要让 undefined 进入 dep
  // 边界，!shouldTrack 时直接返回
  return shouldTrack && activeEffect !== undefined
}

export function trigger(target, key) {
  // 需要对 depsMap 和 dep 是否存在做出判断
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  dep &&
    dep.forEach((effect) => {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    })
}

// 1. 实例化对象
// 2. 接受 options
// 3. 执行 effectFn
// 4. return runner
export function effect(fn, options: any = {}) {
  // 使用 _effect 实例化对象来处理逻辑
  const _effect = new ReactiveEffect(fn)
  // 接收 options
  extend(_effect, options)
  // 通过实例执行
  _effect.run()
  const runner: any = _effect.run.bind(_effect)
  // 返回前保存当前的 effect
  runner.effect = _effect
  return runner
}

export function stop(runner) {
  // runner 是一个 function
  // 通过 runner -> effect，effect.stop()
  // 通过在 effect 中返回 runner 前，在 runner 里塞入当前的 _effect 来解决
  runner.effect.stop()
}
