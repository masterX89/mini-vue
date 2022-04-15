import { isArray } from '../shared'

export function initSlots(instance, children) {
  // children 是一个 object
  normalizeObjectSlots(children, instance.slots)
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key]
    // value 或者说 slot 此时是一个 function
    slots[key] = (props) => normalizeSlotValue(value(props))
  }
}

// 需要判断 children 是 single element 还是 数组
function normalizeSlotValue(value) {
  return isArray(value) ? value : [value]
}
