import { effect } from '../reactivity/effect'
import { EMPTY_ARR, EMPTY_OBJ, ShapeFlags } from '../shared'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, isSameVNodeType, Text } from './vnode'

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
    patch(null, vnode, rootContainer, null, null)
  }

  function patch(n1, n2: any, container: any, parentComponent, anchor) {
    const { type, shapeFlag } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        // TODO: vnode 不合法就没有出口了
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // isString -> processElement
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // isObj ->processComponent
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    const { children } = n2
    mountChildren(children, container, parentComponent, anchor)
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2
    // TODO: 这里使用了 DOM 平台，需要抽离逻辑
    const el = (n2.el = document.createTextNode(children))
    container.append(el)
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 判断是 mount 还是 update
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  // 1. 创建 type === tag 的 el
  // 2. el.props 是 attribute 还是 event
  // 3. children 是否为 string 或者 array
  // 4. 挂载 container.append
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
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
      mountChildren(children, el, parentComponent, anchor)
    }
    hostInsert(el, container, anchor)
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((child) => {
      patch(null, child, container, parentComponent, anchor)
    })
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    const el = (n2.el = n1.el)
    console.log('patchElement')
    console.log('n1: ', n1)
    console.log('n2: ', n2)
    // children
    // 注意这里传入的是 el 而不是 container
    // container 是整个容器
    // 此时更新的仅仅是需要更新节点的 el
    patchChildren(n1, n2, el, parentComponent, anchor)
    // props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    patchProps(el, oldProps, newProps)
  }

  // 此处的 container 是需要更新的容器 即 n1 n2 的 el
  function patchChildren(n1, n2, container, parentComponent, anchor) {
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
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        // ArrayToArray
        patchKeyedChildren(c1, c2, container, parentComponent)
      }
    }
  }

  // 快速 diff
  function patchKeyedChildren(c1, c2, container, parentComponent) {
    // 双端预处理 => 步骤 1 和 2
    let i = 0
    // 长度可能不同
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // 记录 c2 长度
    const l2 = c2.length

    // 1. sync from start
    // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      // 实则此处 while 的条件是边界
      let n1 = c1[i]
      let n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, null)
      } else {
        // 当 n1 与 n2 不相等时为普通出口
        break
      }
      i++
    }
    // 2. sync from end
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      let n1 = c1[e1]
      let n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, null)
      } else {
        break
      }
      e1--
      e2--
    }
    // 预处理结束 理想状态下总有一个 children 处理完毕

    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0

    // oldChildren 处理完毕 说明还有新的节点需要 mount
    // 特征是 i > oldEnd && i <= newEnd 而 [i,newEnd] 区间的内容即为 mount 内容
    if (i > e1) {
      if (i <= e2) {
        // mount
        while (i <= e2) {
          // anchor index -> newEnd + 1
          const anchorIndex = e2 + 1
          // anchorIndex < c2.length -> anchor 在 新的子节点中 -> c2[anchorIndex].el
          // 否则 anchor -> null
          const anchor = anchorIndex < l2 ? c2[anchorIndex].el : null
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    }
    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1

    // newChildren 处理完毕 说明还有旧的节点需要 unmount
    // 特征是 i > newEnd && i <= oldEnd 而 [i, oldEnd] 区间内容即为 unmount 内容
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }
    // 5. unknown sequence
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5

    // 非理想状态要 LIS 找移动节点
    else {
      const s1 = i
      const s2 = i
      // 1. 先完成 patch 和 unmount 逻辑
      // 建立索引
      // 遍历 c1 的 [s1,e1] -> 在索引中找到 newIndex || 没有索引需要遍历寻找 O(n^2)
      // 如果 newIndex === undefined -> unmount
      // 否则 patch 并且记录 source 方便后面 LIS
      const keyToNewIndexMap = new Map()
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }
      // 当 patch >= toBePatched 时可以直接 unmount 并 continue
      let patched = 0
      const toBePatched = e2 - s2 + 1
      // source 数组 -> LIS
      // 0 代表新节点 offset = +1
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
      // 判断是否存在需要移动的节点
      let moved = false
      let maxNewIndexSoFar = 0

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        // 当 patched >= toBePatched 时可以 unmount 并跳过
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // undefined || null
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }
        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }
      // 2. 然后再完成移动以及新增逻辑
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : EMPTY_ARR
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
        if (newIndexToOldIndexMap[i] === 0) {
          // 新增的节点
          patch(null, nextChild, container, parentComponent, anchor)
        } else if (moved) {
          // 存在需要移动的节点
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // j < 0: LIS处理结束剩下的均为需要移动的节点
            // i !== increasingNewIndexSequence[j]: 不在 LIS 中需要移动
            hostInsert(nextChild.el, container, anchor)
          } else {
            // 不是新增的节点也无需移动
            // LIS 的索引向前移动
            j--
          }
        }
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

  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor)
    } else {
      updateComponent(n1, n2)
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component)
    instance.update()
  }

  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 1. 创建 componentInstance
    // 数据类型: vnode -> component
    // component: {vnode, type}
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ))
    // 2. setupComponent(instance)
    setupComponent(instance)
    // 3. setupRenderEffect(instance)
    // 此时 instance 通过 setupComponent 拿到了 render
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  function setupRenderEffect(instance, initialVNode, container, anchor) {
    instance.update = effect(() => {
      // mount 流程
      if (!instance.isMounted) {
        // setupState | $el | $data 的代理
        const { proxy } = instance
        // render 的 this 指向的是 proxy
        // proxy 读取 setup 返回值的时通过 handler 处理掉了 setupState
        const subTree = (instance.subTree = instance.render.call(proxy))
        patch(null, subTree, container, instance, anchor)
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
        patch(preSubTree, subTree, container, instance, anchor)
        // update 流程中 el 是否会被更新？
        // 答案是会的, 在 patchElement 第一步就是 el = n2.el = n1.el
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}

// 注意 arrI 的 edge case:
// [2,0,1,3,4,5] 的 LIS index 是 [2,3,4,5]
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
