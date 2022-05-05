import { h, ref } from '../../lib/mini-vue.esm.js'
export default {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = () => {
      console.log('onClick')
      for (let i = 0; i < 100; i++) {
        count.value = i
      }
    }
    return {
      count,
      onClick,
    }
  },
  render() {
    return h('div', {}, [
      h('p', {}, `${this.count}`),
      h(
        'button',
        {
          onClick: this.onClick,
        },
        `start loop`
      ),
    ])
  },
}
