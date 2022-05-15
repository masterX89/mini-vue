import { baseCompile } from '../compile'

describe('code generate', () => {
  it('should generate string', () => {
    const { code } = baseCompile('hi')
    expect(code).toMatchSnapshot()
  })

  it('should generate interpolation', () => {
    const { code } = baseCompile('{{message}}')
    expect(code).toMatchSnapshot()
  })

  it('should generate nested element', () => {
    const { code } = baseCompile('<div>hi, {{message}}</div>')
    expect(code).toMatchSnapshot()
  })
})
