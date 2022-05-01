import { h, ref } from '../../lib/mini-vue.esm.js'
import Child from './Child.js'

export default {
  setup() {
    let count = ref(0)
    let msg = ref('Child props')
    window.count = count
    window.msg = msg
    return {
      msg,
      count,
    }
  },
  render() {
    return h('div', {}, [
      h('p', {}, `parent count: ${this.count}`),
      h(Child, { msg: this.msg }),
    ])
  },
}
