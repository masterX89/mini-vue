import { h } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {},
  render() {
    return h(
      'div',
      {
        id: 'root',
      },
      [
        h('p', { class: 'red' }, 'hello'),
        h('p', { class: 'green' }, 'mini-vue'),
      ]
    )
  },
}
