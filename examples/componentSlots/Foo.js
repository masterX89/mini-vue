import { h, renderSlot } from '../../lib/mini-vue.esm.js'
// renderSlot 会返回一个 vnode
// 其本质和 h 是一样的
// 第三个参数给出数据
export default {
  setup() {},
  render() {
    // case1: single element
    // this.$slots -> instance.slots -> instance.vnode.children
    // return h('div', {}, [h('p', {}, 'Child Component'), this.$slots])

    // case2: elements array
    // 粗暴解法1: 如果把 this.$slots 直接解构似乎也是可以的
    // return h('div', {}, [h('p', {}, 'Child Component'), ...this.$slots])
    // 粗暴解法2: 但是实际上需要一个 vnode 来接住 slots，即类似 h('div',{},this.$slots)
    // return h('div', {}, [
    //   h('p', {}, 'Child Component'),
    //   renderSlot(this.$slots),
    // ])

    // case3: 具名插槽
    return h('div', {}, [
      renderSlot(this.$slots, 'header'),
      h('p', {}, 'Child Component'),
      renderSlot(this.$slots, 'footer'),
    ])
  },
}
