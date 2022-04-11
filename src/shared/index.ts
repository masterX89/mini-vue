export const extend = Object.assign

export const isObject = (val) => val !== null && typeof val === 'object'
export const isString = (val) => typeof val === 'string'
export const isArray = (val) => Array.isArray(val)
export const isOn = (val) => /^on[A-Z]/.test(val)

// NaN 算作变更
export const hasChanged = (newVal, oldVal) => !Object.is(newVal, oldVal)

export const enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
