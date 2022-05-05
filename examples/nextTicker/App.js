import { h, ref } from '../../lib/mini-vue.esm.js'
export default {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = () => {
      console.log('onClick')
      for (let i = 0; i < 5; i++) {
        count.value = i
      }
      // 此时视图由于异步还没有更新
      console.log('count: ', document.getElementById('counter').textContent)
    }
    return {
      count,
      onClick,
    }
  },
  render() {
    return h('div', {}, [
      h('p', { id: 'counter' }, `${this.count}`),
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
