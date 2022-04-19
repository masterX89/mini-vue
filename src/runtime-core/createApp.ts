import { isString } from '../shared'
import { createVNode } from './vnode'

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 1. 创建 vnode: rootComponent -> vnode
        // vnode: {type, props?, children?}
        const vnode = createVNode(rootComponent)
        // 2. 渲染 vnode: render(vnode, rootContainer)
        render(vnode, convertContainer(rootContainer))
      },
    }
  }
}

function convertContainer(container: any) {
  if (isString(container)) {
    const result = document.querySelector(container)
    return result
  } else {
    // TODO: 考虑 container 为空，需要 document.createElement('div')
    return container
  }
}
