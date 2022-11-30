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
          const child = children[0]
          const type = child.type
          // div -> p -> text(interpolation, compound_expression)
          // p 是单节点不意味着它是叶子节点
          if (type === NodeTypes.TEXT || type === NodeTypes.INTERPOLATION || type === NodeTypes.COMPOUND_EXPRESSION) {
            vnodeChildren = child
          } else {
            vnodeChildren = children
          }
        } else {
          vnodeChildren = children
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
