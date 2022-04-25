import { h, ref } from '../../lib/mini-vue.esm.js'

export const TextToText = {
  name: 'TextToText',
  setup() {
    const switcher = ref(false)
    window.switcher = switcher
    return {
      switcher,
    }
  },
  render() {
    const prevChildren = 'prev Text Children'
    const nextChildren = 'next Text Children'
    return this.switcher
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  },
}
