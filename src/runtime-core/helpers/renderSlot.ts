import { createVNode } from '../vnode'

export function renderSlot(slots, name = 'default') {
  // TODO: default 具名
  const slot = slots[name]
  if (slot) {
    return createVNode('div', {}, slot)
  }
}
