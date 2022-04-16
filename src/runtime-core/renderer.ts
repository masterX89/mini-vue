import { isOn, ShapeFlags } from '../shared'
import { createComponentInstance, setupComponent } from './component'
import { Fragment } from './vnode'

export function render(vnode: any, rootContainer: any) {
  // patch 递归
  patch(vnode, rootContainer)
}
function patch(vnode: any, container: any) {
  const { type, shapeFlag } = vnode

  switch (type) {
    case Fragment:
      processFragment(vnode, container)
      break
    default:
      // TODO: vnode 不合法就没有出口了
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // isString -> processElement
        processElement(vnode, container)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // isObj ->processComponent
        processComponent(vnode, container)
      }
      break
  }
}

function processElement(vnode: any, container: any) {
  // 判断是 mount 还是 update
  mountElement(vnode, container)
  // TODO: updateElement
}

// 1. 创建 type === tag 的 el
// 2. el.props 是 attribute 还是 event
// 3. children 是否为 string 或者 array
// 4. 挂载 container.append
function mountElement(vnode: any, container: any) {
  const { type, props, children, shapeFlag } = vnode
  // 这里的 vnode 是 tag, 通过 vnode.el 把 el 传递出来
  const el = (vnode.el = document.createElement(type))

  if (props) {
    for (const key in props) {
      const val = props[key]
      if (isOn(key)) {
        const event = key.substring(2).toLowerCase()
        el.addEventListener(event, val)
      } else {
        el.setAttribute(key, val)
      }
    }
  }

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.innerText = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el)
  }
  container.append(el)
}

function mountChildren(children, container) {
  children.forEach((child) => {
    patch(child, container)
  })
}

function processComponent(vnode: any, container: any) {
  // 判断是 mount 还是 update
  mountComponent(vnode, container)
  // TODO: updateComponent
}

function mountComponent(initialVNode: any, container: any) {
  // 1. 创建 componentInstance
  // 数据类型: vnode -> component
  // component: {vnode, type}
  const instance = createComponentInstance(initialVNode)
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
  patch(subTree, container)
  // 递归结束, subTree 是 root element, 即最外层的 tag
  // 而这个方法里的 vnode 是一个 componentInstance
  // vnode.el = subTree.el 将 el 传递给了 component
  initialVNode.el = subTree.el
}
function processFragment(vnode: any, container: any) {
  const { children } = vnode
  mountChildren(children, container)
}
