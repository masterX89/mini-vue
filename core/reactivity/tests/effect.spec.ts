import { effect, stop } from '../effect'
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

  it('scheduler', () => {
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    // should not run yet
    expect(dummy).toBe(1)
    // manually run
    run()
    // should have run
    expect(dummy).toBe(2)
  })

  it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    stop(runner)
    obj.prop = 3
    expect(dummy).toBe(2)

    // stopped effect should still be manually callable
    runner()
    expect(dummy).toBe(3)
  })

  it('events: onStop', () => {
    const onStop = jest.fn()
    const runner = effect(() => {}, {
      onStop,
    })

    stop(runner)
    expect(onStop).toHaveBeenCalled()
  })
})
