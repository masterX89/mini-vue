export function codegen(ast) {
  const context = generateContext()
  const push = context.push

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
  context.push(`"${node.content}"`)
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
