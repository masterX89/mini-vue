import { reactive } from '../reactive'

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
  })
})
