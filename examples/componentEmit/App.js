import { h } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  setup() {
    return {
      count: 0,
    }
  },
  render() {
    return h('div', {}, [
      h('p', {}, `App: ${this.count}`),
      h(Foo, {
        count: this.count,
        // emit: onEvent
        onAdd() {
          console.log('onAdd: App Component')
          // TODO: 完成子组件修改父组件 data
        },
      }),
    ])
  },
}
