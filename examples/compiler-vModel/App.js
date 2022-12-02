// 回想 React16 单向绑定: 需要在 onChange 中 setState 修改值
// 而 vue3 使用 v-model 指令可以双向绑定, 选择该指令是由于树的结构相比 v-if 是稳定的, 不涉及 Block
// TODO: 1. runtime 之中完成双向绑定 2. compile 中完成编译
import { ref } from '../../lib/mini-vue.esm.js'
export const App = {
  name: 'App',
  template: `<div><p>{{msg}}</p><input></input></div>`,
  setup() {
    const msg = (window.msg = ref('mini-vue'))
    return {
      msg,
    }
  },
}
