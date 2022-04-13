import { isArray } from '../shared'

export function initSlots(instance, children) {
  instance.slots = normalizeSlotValue(children)
}

// 需要判断 children 是 single element 还是 数组
function normalizeSlotValue(value) {
  return isArray(value) ? value : [value]
}
