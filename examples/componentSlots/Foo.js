import { h } from '../../lib/mini-vue.esm.js'
// renderSlot 会返回一个 vnode
// 其本质和 h 是一样的
// 第三个参数给出数据
export default {
  setup() {},
  render() {
    // case1: single element
    // this.$slots -> instance.slots -> instance.vnode.children
    return h('div', {}, [h('p', {}, 'Child Component'), this.$slots])
  },
}
