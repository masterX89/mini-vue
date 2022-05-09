import { NodeTypes } from '../ast'
import { baseParse } from '../parse'
import { transform } from '../transform'

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
