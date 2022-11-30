import { NodeTypes } from '../../src/ast'
import { baseParse } from '../../src/parse'
import { transform } from '../../src/transform'


describe('compiler: transform v-model', () => {
  test('simple expression', () => {
    // TODO: 单标签结束
    const ast = baseParse('<input v-model="model"></input>')
    const root = transform(ast)
    const node = ast.children[0]

    expect(node).toMatchObject({
      type: 3,
    })

  })
})