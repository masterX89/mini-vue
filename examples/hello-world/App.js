import { h } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {
    return {
      msg: 'this is a msg from setup',
    }
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
      },
      [
        h('p', { class: 'red' }, 'hello'),
        h('p', { class: 'green' }, 'mini-vue'),
        // this.setupState.msg -> this.msg
        // this.$el
        // this.$data
        // 上述通过 代理模式 统一交给用户
        h('p', { class: 'blue' }, this.msg),
      ]
    )
  },
}
