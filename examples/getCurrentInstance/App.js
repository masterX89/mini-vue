import { h, getCurrentInstance } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self = null
export const App = {
  name: 'App',
  setup() {
    console.log('App: ', getCurrentInstance())
  },
  render() {
    return h(
      'div',
      {
        id: 'root',
      },
      [h('p', {}, 'App'), h(Foo)]
    )
  },
}
