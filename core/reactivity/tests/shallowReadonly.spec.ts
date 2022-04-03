import { isReadonly, shallowReadonly } from '../reactive'

describe('shallowReadonly', () => {
  it('should not make non-reactive properties readonly', () => {
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
  })

  it('should call console.warn when set', () => {
    // mock
    console.warn = jest.fn()
    const wrapped = shallowReadonly({
      foo: 1,
    })
    wrapped.foo = 2
    expect(console.warn).toHaveBeenCalled()
  })
})
