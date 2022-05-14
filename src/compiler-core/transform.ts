import { NodeTypes } from './ast'
import { helperMapName, TO_DISPLAY_STRING } from './runtimeHelpers'

export function transform(root, options = {}) {
  const context = createTransformerContext(root, options)
  traverseNode(root, context)
  createRootCodegen(root)
  root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root: any) {
  const { children } = root
  if (children.length === 1) {
    const child = root.children[0]
    if (child.type === NodeTypes.ELEMENT) {
      const codegenNode = child.codegenNode
      root.codegenNode = codegenNode
    } else {
      root.codegenNode = child
    }
  }
}

function traverseNode(node: any, context) {
  const nodeTransforms = context.nodeTransforms
  const exitFns: any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const onExit = transform(node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      break
    default:
      break
  }
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

function traverseChildren(node, context) {
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    traverseNode(children[i], context)
  }
}

function createTransformerContext(root: any, options: any = {}) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1)
    },
  }
  return context
}
