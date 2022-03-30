import { effect } from '../effect'
import { reactive } from '../reactive'

describe('effect', () => {
  it('should be happy path', () => {
    let num = reactive({ value: 1 })
    let res
    effect(() => {
      res = num.value + 1
    })
    expect(res).toBe(2)
    num.value = 2
    expect(res).toBe(3)
  })

  it('should return runner and runner res when call it', () => {
    // effect(fn) -> return runner
    // runner -> fn return
    let foo = 1
    const runner = effect(() => {
      foo++
      return 'foo'
    })
    expect(foo).toBe(2)
    const r = runner()
    expect(foo).toBe(3)
    expect(r).toBe('foo')
  })
})
