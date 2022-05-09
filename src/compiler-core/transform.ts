export function transform(root, options) {
  const context = createTransformerContext(root, options)
  traverseNode(root, context)
}

function traverseNode(node: any, context) {
  const nodeTransforms = context.nodeTransforms
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }
  traverseChildren(node, context)
}

function traverseChildren(node, context) {
  const children = node.children
  if (children) {
    for (let i = 0; i < children.length; i++) {
      traverseNode(children[i], context)
    }
  }
}

function createTransformerContext(root: any, options: any = []) {
  return {
    root,
    nodeTransforms: options.nodeTransforms || [],
  }
}
