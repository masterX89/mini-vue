import { computed } from '../computed'
import { isReactive, reactive } from '../reactive'
import { isRef } from '../ref'


describe('computed', () => {
  it('happy path', () => {
    const user = reactive({
      age: 1,
    })
    const age = computed(() => {
      return user.age
    })
    expect(age.value).toBe(1)
  })

  it('should compute lazily', () => {
    // new Proxy
    const value = reactive({
      foo: 1,
    })
    const getter = jest.fn(() => {
      return value.foo
    })
    // new ComputedRefImpl -> new ReactiveEffect
    const cValue = computed(getter)

    // lazy
    expect(getter).not.toHaveBeenCalled()

    // get value -> 脏 -> run -> _fn -> get -> track -> 干净
    expect(cValue.value).toBe(1)
    // _fn 执行过了一次
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute again
    // 干净 -> _fn 不执行，因此还是一次
    cValue.value // get
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    // set -> trigger -> scheduler -> 标记为 脏
    value.foo = 2
    // 懒计算
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute
    // 读取 计算属性 -> 脏 -> run -> _fn -> get -> track -> 干净
    expect(cValue.value).toBe(2)
    // 真正计算
    expect(getter).toHaveBeenCalledTimes(2)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })

  it('isRef should return true', () => {
    const user = reactive({
      age: 1,
    })
    const age = computed(() => {
      return user.age
    })
    // FIXME: should return true
    expect(isRef(age)).toBe(true)
    expect(isReactive(age)).toBe(false)
  })
})
