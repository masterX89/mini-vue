export const extend = Object.assign

export const isObject = (val) => val !== null && typeof val === 'object'
export const isString = (val) => typeof val === 'string'
export const isArray = (val) => Array.isArray(val)

// NaN 算作变更
export const hasChanged = (newVal, oldVal) => !Object.is(newVal, oldVal)
