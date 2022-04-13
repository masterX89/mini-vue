import { createVNode } from '../vnode'

export function renderSlot(slots) {
  return createVNode('div', {}, slots)
}
