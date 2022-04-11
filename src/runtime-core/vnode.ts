import { isObject, isString, ShapeFlags } from '../shared'

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
  }
  vnode.shapeFlag |= isString(children)
    ? ShapeFlags.TEXT_CHILDREN
    : ShapeFlags.ARRAY_CHILDREN
  return vnode
}
function getShapeFlag(type: any) {
  return isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}
