import { h, ref, nextTick } from '../../lib/mini-vue.esm.js'
export default {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = async () => {
      console.log('onClick')
      for (let i = 0; i < 5; i++) {
        count.value = i
      }
      // 此时视图由于异步还没有更新 -> 0
      console.log('count: ', document.getElementById('counter').textContent)
      nextTick(() => {
        console.log('count: ', document.getElementById('counter').textContent)
      })
      // await nextTick()
      // console.log('count: ', document.getElementById('counter').textContent)
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
