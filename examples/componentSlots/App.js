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
    foo = [h('p', {}, 'element-01'), h('p', {}, 'element-02')]

    return h('div', {}, [h('div', {}, 'Parent Component'), h(Foo, {}, foo)])
  },
}
