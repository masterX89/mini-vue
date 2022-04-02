import { isReadonly, reactive, readonly } from '../reactive'

describe('reactive', () => {
  it('should be happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
    // isReadonly
    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(wrapped)).toBe(true)
    const observed = reactive(original)
    expect(isReadonly(observed)).toBe(false)
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
