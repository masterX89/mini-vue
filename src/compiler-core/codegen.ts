import { NodeTypes } from './ast'

export function codegen(ast) {
  const context = generateContext()
  const push = context.push
  // TODO: 处理 import
  if (ast.codegenNode.type === NodeTypes.INTERPOLATION) {
    push(`const { toDisplayString: _toDisplayString } = Vue`)
  }
  push('\n')
  push('return ')
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
function genNode(node, context) {
  console.log(node)
  switch (node.type) {
    case NodeTypes.TEXT:
      context.push(`"${node.content}"`)
      break
    case NodeTypes.INTERPOLATION:
      // TODO: 处理 expression
      context.push(`_toDisplayString(_ctx.${node.content.content})`)
      break
    default:
      break
  }
}

function generateContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source
    },
  }
  return context
}
