import { h, ref } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {
    const count = ref(0)
    // 这里如果使用类似 foo = ref('foo') 放入到 props 中也是可以实现对应效果的
    // 同样的用 reactive 包装也可以，但是这样会无法检测到 整个变动

    // 首先在 render 中使用 ...this.props 先到代理模式中 PublicInstanceProxyHandlers 的 get 中
    // 返回了 setupState.props 到了 proxyRefs 的 get 中进行 unRef 操作
    // 脱ref 会返回 .value 又进入了 RefImpl 的 get value() 会返回 this._value
    // 而 this._value 是一个 object, 在创建的时候已经被 reactive 包装了
    // 展开运算符会到 reactive 的 get
    const props = ref({
      foo: 'foo',
      bar: 'bar',
    })
    const onClick = () => {
      count.value++
    }
    const onChangePropsDemo1 = () => {
      props.value.foo = 'newFoo'
    }
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined
    }
    const onChangePropsDemo3 = () => {
      props.value.foo = null
    }
    const onChangePropsDemo4 = () => {
      props.value = { foo: 'foo' }
    }
    const onChangePropsDemo5 = () => {
      props.value = { foo: 'foo', bar: 'bar', baz: 'baz' }
    }
    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      onChangePropsDemo4,
      onChangePropsDemo5,
    }
  },
  render() {
    return h(
      'div',
      {
        ...this.props,
      },
      [
        h('p', {}, `count: ${this.count}`),
        h(
          'button',
          {
            onClick: this.onClick,
          },
          'count++'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo1,
          },
          'change prop: foo to newFoo'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo2,
          },
          'change prop: foo to undefined'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo3,
          },
          'change prop: foo to null'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo4,
          },
          'delete prop: bar'
        ),
        h(
          'button',
          {
            onClick: this.onChangePropsDemo5,
          },
          'add prop: baz'
        ),
      ]
    )
  },
}
