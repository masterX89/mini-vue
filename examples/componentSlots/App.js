import { h } from '../../lib/mini-vue.esm.js'
import Foo from './Foo.js'

export default {
  setup() {},

  render() {
    // TODO: 字符串字面量
    // TODO: slots 传递组件
    let foo
    // case 1: slots 为 single element
    // foo = h('p', {}, 'this is a single element')

    // case 2: slots 为 element 数组
    // foo = [h('p', {}, 'element-01'), h('p', {}, 'element-02')]

    // case 3: 具名插槽
    // 从 case 3 开始，slots 的数据结构亦发生了变化: array -> object
    // case2 变为
    // foo = {
    //   default: [h('p', {}, 'element-01'), h('p', {}, 'element-02')],
    // }
    // foo = {
    //   header: [h('p', {}, 'element-01'), h('p', {}, 'element-02')],
    //   footer: h('p', {}, 'this is footer'),
    // }

    // case4: 作用域插槽
    // slots 依旧是 obj
    // slot 从 array 变成了 返回 array 的 function
    // slot() 后才会得到对应的 array
    foo = {
      header: ({ num_1, num_2 }) => [
        h('p', {}, 'element-' + num_1),
        h('p', {}, 'element-' + num_2),
      ],
      footer: () => h('p', {}, 'this is footer'),
    }
    return h('div', {}, [h('div', {}, 'Parent Component'), h(Foo, {}, foo)])
  },
}
