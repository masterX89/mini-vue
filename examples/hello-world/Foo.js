import { h } from '../../lib/mini-vue.esm.js'

// props
// 1. 参数接收 props
// 2. render 通过 this 可以获取到 props
// 3. props 是 shallowReadonly
// TODO: props 是否合法，非法需要加入 attrs
export const Foo = {
  setup(props) {
    // props = { count: 1 }
    console.log(props)
    // props.count should still be 1
    // 同时应该抛出一个 warning
    props.count++
  },
  render() {
    // props.count should still be 1
    // 由于 PublicInstanceProxyHandlers 没有 set 所以并不会奏效
    this.count = 100
    return h('div', {}, `props: ${this.count}`)
  },
}
