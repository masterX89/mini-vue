import { codegen } from '../codegen'
import { baseParse } from '../parse'
import { transform } from '../transform'
import { transformExpression } from '../transforms/transformExpression'

describe('code generate', () => {
  it('should generate string', () => {
    const ast = baseParse('hi')
    transform(ast)
    const { code } = codegen(ast)
    expect(code).toMatchSnapshot()
  })

  it('should generate interpolation', () => {
    const ast = baseParse('{{message}}')
    transform(ast, {
      nodeTransforms: [transformExpression],
    })
    const { code } = codegen(ast)
    expect(code).toMatchSnapshot()
  })
})
