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
})
