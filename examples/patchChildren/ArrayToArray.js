import { h, ref } from '../../lib/mini-vue.esm.js'

export const ArrayToArray = {
  name: 'ArrayToArray',
  setup() {
    const switcher = ref(false)
    window.switcher = switcher
    return {
      switcher,
    }
  },
  render() {
    const prevChildren = [
      h('p', {}, 'prevArrayChildOne'),
      h('p', {}, 'prevArrayChildTwo'),
    ]
    const nextChildren = [
      h('p', {}, 'nextArrayChildOne'),
      h('p', {}, 'nextArrayChildTwo'),
    ]
    return this.switcher
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  },
}
