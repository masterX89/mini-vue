import { isFunction } from '../../shared'
import { createVNode, Fragment } from '../vnode'

export function renderSlot(slots, name = 'default', props) {
  // TODO: default 具名
  const slot = slots[name]
  if (slot) {
    // slot: (props) => h(el, {}, props)
    if (isFunction(slot)) {
      // 需要使用 Fragment
      return createVNode(Fragment, {}, slot(props))
    }
  }
}
