import { isFunction } from '../../shared'
import { createVNode } from '../vnode'

export function renderSlot(slots, name = 'default', props) {
  // TODO: default 具名
  const slot = slots[name]
  if (slot) {
    // slot: (props) => h(el, {}, props)
    if (isFunction(slot)) {
      return createVNode('div', {}, slot(props))
    }
  }
}
