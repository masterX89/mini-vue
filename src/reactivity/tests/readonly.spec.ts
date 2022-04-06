import { isProxy, isReactive, isReadonly, readonly } from '../reactive'

describe('readonly', () => {
  it('should be happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
    // isReadonly
    expect(isReactive(wrapped)).toBe(false)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReactive(original)).toBe(false)
    expect(isReadonly(original)).toBe(false)
    expect(isReactive(wrapped.bar)).toBe(false)
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReactive(original.bar)).toBe(false)
    expect(isReadonly(original.bar)).toBe(false)
    // isProxy
    expect(isProxy(wrapped)).toBe(true)
    expect(isProxy(original)).toBe(false)
    // get
    expect(wrapped.foo).toBe(1)
    // has
    expect('foo' in wrapped).toBe(true)
    // ownKeys
    expect(Object.keys(wrapped)).toEqual(['foo', 'bar'])
  })

  it('should call console.warn when set', () => {
    // mock
    console.warn = jest.fn()
    const wrapped = readonly({
      foo: 1,
    })
    wrapped.foo = 2
    expect(console.warn).toHaveBeenCalled()
  })
})
