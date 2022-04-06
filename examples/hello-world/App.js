import { h } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {},
  render() {
    return h(
      'div',
      {
        id: 'root',
        onClick: () => alert('onClick!'),
      },
      'hello vue.js'
    )
  },
}
