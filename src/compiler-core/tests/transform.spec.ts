import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'
import { transform } from '../src/transform'

describe('transform', () => {
  test('happy path', () => {
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += ' mini-vue'
      }
    }
    const ast = baseParse('<div>hi,{{message}}</div>')
    transform(ast, {
      nodeTransforms: [plugin],
    })
    expect(ast.children[0].children[0].content).toBe('hi, mini-vue')
  })
})
