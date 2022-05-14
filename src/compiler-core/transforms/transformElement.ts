import { createVNodeCall, NodeTypes } from '../ast'

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // tag
      const vnodeTag = `"${node.tag}"`
      // props
      let vnodeProps
      // children
      const { children } = node
      let vnodeChildren
      if (children.length > 0) {
        if (children.length === 1) {
          vnodeChildren = children[0]
        }
      }
      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      )
    }
  }
}
