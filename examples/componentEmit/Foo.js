import { h } from '../../lib/mini-vue.esm.js'

export const Foo = {
  setup(props, { emit }) {
    console.log('props: ', props)
    const emitAdd = () => {
      console.log('Foo Component')
      // event 发射到父组件 -> 执行父组件的 onEvent
      emit('add')
    }
    return {
      emitAdd,
    }
  },
  render() {
    const foo = h('p', {}, `Foo: ${this.count}`)
    const btn = h(
      'button',
      {
        onClick: this.emitAdd,
      },
      'emit add'
    )
    return h('div', {}, [foo, btn])
  },
}
