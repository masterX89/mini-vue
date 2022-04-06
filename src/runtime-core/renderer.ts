import { isArray, isObject, isString } from '../shared'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, rootContainer: any) {
  // patch 递归
  patch(vnode, rootContainer)
}
function patch(vnode: any, container: any) {
  const { type } = vnode

  if (isString(type)) {
    // isString -> processElement
    processElement(vnode, container)
  } else if (isObject(type)) {
    // isObj ->processComponent
    processComponent(vnode, container)
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
  const { type, props, children } = vnode
  const el = document.createElement(type)

  // TODO: refactor to function handle props
  if (props) {
    for (const key in props) {
      el.setAttribute(key, props[key])
      // TODO: event
    }
  }

  if (isString(children)) {
    el.innerText = children
  } else if (isArray(children)) {
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

function mountComponent(vnode: any, container: any) {
  // 1. 创建 componentInstance
  // 数据类型: vnode -> component
  // component: {vnode, type}
  const instance = createComponentInstance(vnode)
  // 2. setupComponent(instance)
  setupComponent(instance)
  // 3. setupRenderEffect(instance)
  // 此时 instance 通过 setupComponent 拿到了 render
  setupRenderEffect(instance, container)
}
function setupRenderEffect(instance, container) {
  const subTree = instance.render()
  patch(subTree, container)
}
