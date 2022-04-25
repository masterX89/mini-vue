import { h, ref } from '../../lib/mini-vue.esm.js'

export const ArrayToText = {
  name: 'ArrayToText',
  setup() {
    const switcher = ref(false)
    window.switcher = switcher
    return {
      switcher,
    }
  },
  render() {
    const prevChildren = [
      h('p', {}, 'arrayChildOne'),
      h('p', {}, 'arrayChildTwo'),
    ]
    const nextChildren = 'next Text Children'
    return this.switcher
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  },
}
