import { h, ref } from '../../lib/mini-vue.esm.js'

export const TextToArray = {
  name: 'TextToArray',
  setup() {
    const switcher = ref(false)
    window.switcher = switcher
    return {
      switcher,
    }
  },
  render() {
    const prevChildren = 'prev Text Children'
    const nextChildren = [
      h('p', {}, 'arrayChildOne'),
      h('p', {}, 'arrayChildTwo'),
    ]
    return this.switcher
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  },
}
