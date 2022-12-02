import { isString } from '../../shared'
import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from './runtimeHelpers'

export function generate(ast) {
  const context = generateContext()
  const { push } = context

  genFunctionPreamble(ast, context)
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}) {`)
  push('return ')
  genNode(ast.codegenNode, context)
  push('}')
  return {
    code: context.code,
  }
}

function genFunctionPreamble(ast, context) {
  const { push } = context
  const VueBinging = 'Vue'
  const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
  }
  push('\n')
  push('return ')
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    default:
      break
  }
}

function genCompoundExpression(node: any, context: any) {
  const { children } = node
  const { push } = context
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isString(child)) {
      push(child)
    } else {
      genNode(child, context)
    }
  }
}

function genElement(node, context) {
  const { push, helper } = context
  const { tag, props, children } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullableArgs([tag, props, children]), context)
  push(')')
}

function genChildren(nodes, context) {
  if (nodes.length === 1) {
    const child = nodes[0]
    const type = child.type
    if (type === NodeTypes.TEXT || type === NodeTypes.INTERPOLATION || type === NodeTypes.COMPOUND_EXPRESSION) {
      genNodeList(nodes, context)
    } else {
      genNodeListAsArray(nodes, context)
    }
  } else {
    genNodeListAsArray(nodes, context)
  }
}

function genNodeListAsArray(nodes, context) {
  const { push } = context
  push('[')
  genNodeList(nodes, context)
  push(']')
}

function genNodeList(nodes, context) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      // tag or null props
      // FIXME: 可能来自 node 也可能来自 node.codegenNode 需要做统一
      if (node.slice(0, 1) === '"' || node === 'null') {
        push(node)
      } else {
        push(`"${node}"`)
      }
    } else if (Array.isArray(node)) {
      // Array: children nodes
      genChildren(node, context)
    } else {
      // Object: node
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}

function genNullableArgs(args) {
  return args.map((arg) => arg || 'null')
}

function genExpression(node: any, context: any) {
  const { push } = context
  push(`${node.content}`)
}

function genInterpolation(node: any, context: any) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}

function genText(node, context) {
  const { push } = context
  push(`"${node.content}"`)
}

function generateContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source
    },
    helper(key) {
      return `_${helperMapName[key]}`
    },
  }
  return context
}
