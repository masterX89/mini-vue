import { NodeTypes } from '../ast'
import { baseParse } from '../parse'

describe('Parse', () => {
  describe('interpolation', () => {
    it('interpolation happy path', () => {
      const ast = baseParse('{{message}}')
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message',
        },
      })
    })
  })
})
