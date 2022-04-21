import { h, ref } from '../../lib/mini-vue.esm.js'

export const App = {
  setup() {
    const count = ref(0)
    const onClick = () => {
      count.value++
    }
    return {
      count,
      onClick,
    }
  },
  render() {
    return h('div', {}, [
      h('p', {}, `count: ${this.count}`),
      h(
        'button',
        {
          onClick: this.onClick,
        },
        'count++'
      ),
    ])
  },
}
