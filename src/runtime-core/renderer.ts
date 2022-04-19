import { isOn, ShapeFlags } from '../shared'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options

  function render(vnode: any, rootContainer: any) {
    // patch 递归
    patch(vnode, rootContainer, null)
  }

  function patch(vnode: any, container: any, parentComponent) {
    const { type, shapeFlag } = vnode

    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent)
        break
      case Text:
        processText(vnode, container)
        break
      default:
        // TODO: vnode 不合法就没有出口了
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // isString -> processElement
          processElement(vnode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // isObj ->processComponent
          processComponent(vnode, container, parentComponent)
        }
        break
    }
  }

  function processFragment(vnode: any, container: any, parentComponent) {
    const { children } = vnode
    mountChildren(children, container, parentComponent)
  }

  function processText(vnode: any, container: any) {
    const { children } = vnode
    const el = (vnode.el = document.createTextNode(children))
    container.append(el)
  }

  function processElement(vnode: any, container: any, parentComponent) {
    // 判断是 mount 还是 update
    mountElement(vnode, container, parentComponent)
    // TODO: updateElement
  }

  // 1. 创建 type === tag 的 el
  // 2. el.props 是 attribute 还是 event
  // 3. children 是否为 string 或者 array
  // 4. 挂载 container.append
  function mountElement(vnode: any, container: any, parentComponent) {
    const { type, props, children, shapeFlag } = vnode
    // 这里的 vnode 是 tag, 通过 vnode.el 把 el 传递出来
    const el = (vnode.el = hostCreateElement(type))

    if (props) {
      for (const key in props) {
        const val = props[key]
        hostPatchProp(el, key, val)
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.innerText = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent)
    }
    hostInsert(el, container)
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((child) => {
      patch(child, container, parentComponent)
    })
  }

  function processComponent(vnode: any, container: any, parentComponent) {
    // 判断是 mount 还是 update
    mountComponent(vnode, container, parentComponent)
    // TODO: updateComponent
  }

  function mountComponent(initialVNode: any, container: any, parentComponent) {
    // 1. 创建 componentInstance
    // 数据类型: vnode -> component
    // component: {vnode, type}
    const instance = createComponentInstance(initialVNode, parentComponent)
    // 2. setupComponent(instance)
    setupComponent(instance)
    // 3. setupRenderEffect(instance)
    // 此时 instance 通过 setupComponent 拿到了 render
    setupRenderEffect(instance, initialVNode, container)
  }

  function setupRenderEffect(instance, initialVNode, container) {
    // setupState | $el | $data 的代理
    const { proxy } = instance
    // render 的 this 指向的是 proxy
    // proxy 读取 setup 返回值的时通过 handler 处理掉了 setupState
    const subTree = instance.render.call(proxy)
    patch(subTree, container, instance)
    // 递归结束, subTree 是 root element, 即最外层的 tag
    // 而这个方法里的 vnode 是一个 componentInstance
    // vnode.el = subTree.el 将 el 传递给了 component
    initialVNode.el = subTree.el
  }

  return {
    createApp: createAppAPI(render),
  }
}
