import { effect } from '../reactivity/effect'
import { EMPTY_OBJ, ShapeFlags } from '../shared'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options

  function render(vnode: any, rootContainer: any) {
    // patch 递归
    patch(null, vnode, rootContainer, null)
  }

  function patch(n1, n2: any, container: any, parentComponent) {
    const { type, shapeFlag } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        // TODO: vnode 不合法就没有出口了
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // isString -> processElement
          processElement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // isObj ->processComponent
          processComponent(n1, n2, container, parentComponent)
        }
        break
    }
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    const { children } = n2
    mountChildren(children, container, parentComponent)
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2
    // TODO: 这里使用了 DOM 平台，需要抽离逻辑
    const el = (n2.el = document.createTextNode(children))
    container.append(el)
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    // 判断是 mount 还是 update
    if (!n1) {
      mountElement(n2, container, parentComponent)
    } else {
      patchElement(n1, n2, container, parentComponent)
    }
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
        hostPatchProp(el, key, null, val)
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
      patch(null, child, container, parentComponent)
    })
  }

  function patchElement(n1, n2, container, parentComponent) {
    const el = (n2.el = n1.el)
    console.log('patchElement')
    console.log('n1: ', n1)
    console.log('n2: ', n2)
    // children
    // 注意这里传入的是 el 而不是 container
    // container 是整个容器
    // 此时更新的仅仅是需要更新节点的 el
    patchChildren(n1, n2, el, parentComponent)
    // props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    patchProps(el, oldProps, newProps)
  }

  // 此处的 container 是需要更新的容器 即 n1 n2 的 el
  function patchChildren(n1, n2, container, parentComponent) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag, children: c2 } = n2
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // remove all children
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        // (ArrayToText | TextToText) -> insert text element
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // TextToArray
        // 清空 textContent
        hostSetElementText(container, null)
        // mountChildren
        mountChildren(c2, container, parentComponent)
      } else {
        // ArrayToArray
        unmountChildren(c1)
        mountChildren(c2, container, parentComponent)
      }
    }
  }

  function unmountChildren(children) {
    // XXX: 这里为什么用 for 而不是 forEach
    // 并且vue3源码中的remove是把parentComponent也传递了过去
    // 按理来说传递后就不需要使用 Node.parentNode 来找 parent 了
    // 多次找 parentNode 也是一个消耗因为可能是同一个
    for (let i = 0; i < children.length; i++) {
      // 注意这里需要传入 el
      // children[i] 只是一个 vnode
      hostRemove(children[i].el)
    }
  }

  function patchProps(el, oldProps, newProps) {
    // TODO: 关注 #5773 结果, 这个判断涉及到一个性能平衡点
    // 如果使用 hasPropsChanged 在 element 的 props 没有更新的情况下会节省一次循环
    // 但是同时会导致 props 更新的情况下多出一次循环
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]
        if (nextProp !== prevProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            const prevProp = oldProps[key]
            hostPatchProp(el, key, prevProp, null)
          }
        }
      }
    }
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    // 判断是 mount 还是 update
    mountComponent(n2, container, parentComponent)
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
    effect(() => {
      // mount 流程
      if (!instance.isMounted) {
        // setupState | $el | $data 的代理
        const { proxy } = instance
        // render 的 this 指向的是 proxy
        // proxy 读取 setup 返回值的时通过 handler 处理掉了 setupState
        const subTree = (instance.subTree = instance.render.call(proxy))
        patch(null, subTree, container, instance)
        // 递归结束, subTree 是 root element, 即最外层的 tag
        // 而这个方法里的 vnode 是一个 componentInstance
        // vnode.el = subTree.el 将 el 传递给了 component
        initialVNode.el = subTree.el
        // 更新 isMounted 状态
        instance.isMounted = true
      } else {
        const { proxy } = instance
        const subTree = instance.render.call(proxy)
        const preSubTree = instance.subTree
        // 更新 instance 的 subTree
        instance.subTree = subTree
        patch(preSubTree, subTree, container, instance)
        // XXX: update 流程中 el 是否会被更新？
        // initialVNode.el = subTree.el
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
