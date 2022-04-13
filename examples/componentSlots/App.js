import { h } from '../../lib/mini-vue.esm.js'
import Foo from './Foo.js'

export default {
  setup() {},

  render() {
    // TODO: 字符串字面量
    // TODO: slots 传递组件
    // case 1: slots 为 single element
    const foo = h('p', {}, 'this is a single element')
    return h('div', {}, [h('div', {}, 'Parent Component'), h(Foo, {}, foo)])
  },
}
