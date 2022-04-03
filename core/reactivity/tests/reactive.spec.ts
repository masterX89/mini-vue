import { isProxy, isReactive, isReadonly, reactive } from '../reactive'

describe('reactive', () => {
  it('should be happy path', () => {
    const original: any = {
      foo: 1,
    }
    const observed = reactive(original)
    // proxy
    expect(observed).not.toBe(original)
    // get
    expect(observed.foo).toBe(1)
    // set
    observed.foo = 2
    expect(observed.foo).toBe(2)
    expect(original.foo).toBe(2)
    observed.bar = 1
    expect(observed.bar).toBe(1)
    expect(original.bar).toBe(1)
    // isReactive
    expect(isReactive(original)).toBe(false)
    expect(isReactive(observed)).toBe(true)
    // isReadonly
    expect(isReadonly(observed)).toBe(false)
    expect(isReadonly(original)).toBe(false)
    // isProxy
    expect(isProxy(observed)).toBe(true)
    expect(isProxy(original)).toBe(false)
  })

  it('nested reactives', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})
