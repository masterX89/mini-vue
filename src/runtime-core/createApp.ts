import { render } from './renderer'
import { createVNode } from './vnode'

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 1. 创建 vnode: rootComponent -> vnode
      // vnode: {type, props?, children?}
      const vnode = createVNode(rootComponent)
      // 2. 渲染 vnode: render(vnode, rootContainer)
      render(vnode, rootContainer)
    },
  }
}
