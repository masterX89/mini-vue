import { createRenderer } from '../runtime-core'
import { isOn } from '../shared'

function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, prevVal, nextVal) {
  if (isOn(key)) {
    const event = key.substring(2).toLowerCase()
    el.addEventListener(event, nextVal)
  } else if (nextVal === undefined || nextVal === null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, nextVal)
  }
}

function insert(el, container) {
  container.append(el)
}

function remove(el) {
  const parentNode = el.parentNode
  if (parentNode) {
    parentNode.removeChild(el)
  }
}

function setElementText(container, children) {
  // XXX: textContent v. innerText
  container.textContent = children
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'
