import { isArray } from '../shared'

export function initSlots(instance, children) {
  // children 是一个 object
  const slots = {}
  for (const key in children) {
    const value = children[key]
    slots[key] = normalizeSlotValue(value)
  }
  instance.slots = slots
}

// 需要判断 children 是 single element 还是 数组
function normalizeSlotValue(value) {
  return isArray(value) ? value : [value]
}
