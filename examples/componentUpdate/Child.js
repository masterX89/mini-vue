import { h } from '../../lib/mini-vue.esm.js'

export default {
  setup() {},
  render() {
    return h('p', {}, this.$props.msg)
  },
}
