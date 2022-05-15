import { ref } from '../../lib/mini-vue.esm.js'
export const App = {
  name: 'App',
  template: `<div>hi, {{message}}, {{count}}</div>`,
  setup() {
    const message = 'mini-vue'
    const count = (window.count = ref(0))
    return {
      message,
      count,
    }
  },
}
