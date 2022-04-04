export const extend = Object.assign

export const isObject = (val) => val !== null && typeof val === 'object'

// NaN 算作变更
export const hasChanged = (newVal, oldVal) => !Object.is(newVal, oldVal)
