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
