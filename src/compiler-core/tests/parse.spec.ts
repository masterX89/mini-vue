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
  describe('element', () => {
    it('element div', () => {
      const ast = baseParse('<div></div>')
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
      })
    })
  })
  describe('text', () => {
    it('simple text', () => {
      const ast = baseParse('simple text')
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'simple text',
      })
    })
  })
})
