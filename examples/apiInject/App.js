import { h } from '../../lib/mini-vue.esm.js'
import { provide, inject } from '../../lib/mini-vue.esm.js'

export const ProvideOne = {
  name: 'ProvideOne',
  setup() {
    provide('foo', 'foo')
    provide('bar', 'bar')
  },
  render() {
    return h(ProvideTwo)
  },
}

const ProvideTwo = {
  name: 'ProvideTwo',
  setup() {
    provide('foo', 'fooOverride')
    provide('baz', 'baz')
    const foo = inject('foo')
    return {
      foo,
    }
  },
  render() {
    return h('Fragment', {}, [h('p', {}, `ProvideTwo: ${this.foo}`), h(Foo)])
  },
}

const Foo = {
  name: 'Foo',
  setup() {
    const foo = inject('foo')
    const bar = inject('bar')
    const baz = inject('baz')
    const bax = inject('bax', 'baxDefault')
    const func = inject('func', () => 'func')
    return {
      foo,
      bar,
      baz,
      bax,
      func,
    }
  },
  render() {
    return h(
      'p',
      {},
      `Foo: ${this.foo} - ${this.bar} - ${this.baz} - ${this.bax} - ${this.func}`
    )
  },
}
