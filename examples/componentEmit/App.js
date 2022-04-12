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
          // 几个问题：
          // 涉及到了组件更新
          // 如果将 emit 改写为 handler && handler.call(instance)
          // 那么此时的 instance 实际为 子组件，即这里的 this 指向的是子组件
          // console.log(this.props.count)
        },
      }),
    ])
  },
}
