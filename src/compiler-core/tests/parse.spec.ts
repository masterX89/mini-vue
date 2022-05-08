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
        children: [],
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

  test('hello', () => {
    const ast = baseParse('<div>hello</div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.TEXT,
          content: 'hello',
        },
      ],
    })
  })

  test('element interpolation', () => {
    const ast = baseParse('<div>{{ message }}</div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    })
  })

  test('hello world', () => {
    const ast = baseParse('<div>hello,{{ message }}</div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.TEXT,
          content: 'hello,',
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    })
  })

  test('Nested element', () => {
    const ast = baseParse('<div><p>hello</p>,{{ message }}</div>')
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'p',
          children: [
            {
              type: NodeTypes.TEXT,
              content: 'hello',
            },
          ],
        },
        {
          type: NodeTypes.TEXT,
          content: ',',
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    })
  })
})
