import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _dirty: boolean = true
  private _effect: ReactiveEffect
  constructor(getter) {
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }

  get value(): any {
    if (this._dirty) {
      this._dirty = false
      return this._effect.run()
    }
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}
