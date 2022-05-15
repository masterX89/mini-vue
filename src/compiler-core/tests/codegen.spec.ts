import { generate } from '../codegen'
import { baseParse } from '../parse'
import { transform } from '../transform'
import { transformElement } from '../transforms/transformElement'
import { transformExpression } from '../transforms/transformExpression'
import { transformText } from '../transforms/transformText'

describe('code generate', () => {
  it('should generate string', () => {
    const ast = baseParse('hi')
    transform(ast)
    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })

  it('should generate interpolation', () => {
    const ast = baseParse('{{message}}')
    transform(ast, {
      nodeTransforms: [transformExpression],
    })
    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })

  it('should generate nested element', () => {
    const ast: any = baseParse('<div>hi, {{message}}</div>')
    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    })
    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })
})
