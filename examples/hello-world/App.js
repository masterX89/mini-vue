import { h } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

// 测试代码
window.self = null
export const App = {
  setup() {
    return {
      msg: 'this is a msg from setup',
    }
  },
  render() {
    // 测试代码
    window.self = this
    return h(
      'div',
      {
        id: 'root',
        onClick: () => {
          alert('click!')
        },
      },
      [
        h('p', { class: 'red' }, 'hello'),
        h('p', { class: 'green' }, 'mini-vue'),
        // this.setupState.msg -> this.msg
        // this.$el -> root element 实例, 给用户直接操作 dom 的方法
        // this.$data
        // 上述通过 代理模式 统一交给用户
        h('p', { class: 'blue' }, this.msg),
        h(Foo, { count: 1 }),
      ]
    )
  },
}
