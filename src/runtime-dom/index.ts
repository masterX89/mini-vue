import { createRenderer } from '../runtime-core'
import { isOn } from '../shared'

function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, val) {
  if (isOn(key)) {
    const event = key.substring(2).toLowerCase()
    el.addEventListener(event, val)
  } else if (val === undefined || val === null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, val)
  }
}

function insert(el, container) {
  container.append(el)
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'
