import { effect } from '../effect'
import { reactive } from '../reactive'
import { isRef, proxyRefs, ref, unRef } from '../ref'
describe('ref', () => {
  it('happy path', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  })

  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    })
    let dummy
    effect(() => {
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  it('should not trigger when nested properties reactive is same', () => {
    let calls = 0
    const original = { count: 1 }
    const a = ref(original)
    let dummy
    effect(() => {
      calls++
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    expect(calls).toBe(1)
    // same value should not trigger
    a.value = original
    expect(dummy).toBe(1)
    expect(calls).toBe(1)
  })

  it('isRef', () => {
    const a = ref(1)
    const b = reactive({ value: 1 })
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(b)).toBe(false)
    expect(a.__v_isRef).toBe(true)
  })

  it('unRef', () => {
    const a = ref(1)
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
  })

  it('proxyRefs', () => {
    const obj = {
      foo: ref(10),
      bar: 'test',
    }

    // ref 是 RefImpl，是需要使用 .value 来读取的
    // 无需使用 .value 读取的应该使用 Proxy 来拦截 get 以及 set
    // 所以 newObj 应该是return new Proxy
    const newObj = proxyRefs(obj)
    expect(obj.foo.value).toBe(10)

    // get 拦截时，使用 unRef 来脱 ref
    expect(newObj.foo).toBe(10)
    expect(newObj.bar).toBe('test')

    // set 拦截时
    // | newVal | oldVal | 处理
    // | !isRef | isRef  | ref.value = newVal
    // | !isRef | !isRef | Reflect.set
    // | isRef  | isRef  | Reflect.set
    // | isRef  | !isRef | Reflect.set
    newObj.foo = 20
    expect(newObj.foo).toBe(20)
    expect(obj.foo.value).toBe(20)

    newObj.foo = ref(10)
    expect(newObj.foo).toBe(10)
    expect(obj.foo.value).toBe(10)
  })

  it('proxyRefs reactive', () => {
    const foo = ref(0)
    const addFoo = () => {
      foo.value++
    }
    const barObj = reactive({ num: 0 })
    const addBar = () => {
      barObj.num++
    }
    // setupResult
    const obj = {
      foo,
      addFoo,
      barObj,
      addBar,
    }
    // handleSetupResult
    const newObj = proxyRefs(obj)

    let count = 0
    effect(() => {
      // render
      newObj.foo
      newObj.barObj.num
      count++
    })
    expect(count).toBe(1)
    newObj.addFoo()
    expect(count).toBe(2)
    newObj.addBar()
    expect(count).toBe(3)
  })
})
