import { extend } from '../shared'
import { NodeTypes } from './ast'

export function baseParse(content: string, options = {}) {
  // 将 content 包装至 ctx 中
  const context = createParserContext(content, options)
  return createRoot(parseChildren(context))
}

function parseChildren(context) {
  const nodes: any = []
  let node
  const openDelimiter = context.options.delimiters[0]
  if (context.source.startsWith(openDelimiter)) {
    node = parseInterpolation(context)
  }
  nodes.push(node)
  return nodes
}

function parseInterpolation(context) {
  const openDelimiter = context.options.delimiters[0]
  const closeDelimiter = context.options.delimiters[1]
  // context -> content

  // 注意 indexOf 是带一个 [, fromIndex] 可选参数的
  // 并且 closeIndex 需要在 advanceBy 先保留下来
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  )
  // slice 是 非 破坏性方法 因此需要 赋值
  advanceBy(context, openDelimiter.length)
  // {{msg}}
  // openDelimiter.length: 2, closeIndex: 5
  const rawContentLength = closeIndex - openDelimiter.length
  const rawContent = context.source.slice(0, rawContentLength)
  const content = rawContent.trim()
  advanceBy(context, rawContentLength + closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  }
}

function advanceBy(context, length) {
  context.source = context.source.slice(length)
}

function createRoot(children) {
  return {
    children,
  }
}

function createParserContext(content: string, rawOptions) {
  const options = extend({}, defaultParserOptions)
  for (const key in rawOptions) {
    options[key] =
      rawOptions[key] === undefined
        ? defaultParserOptions[key]
        : rawOptions[key]
  }
  return {
    options,
    source: content,
  }
}

const defaultParserOptions = {
  delimiters: [`{{`, `}}`],
}
