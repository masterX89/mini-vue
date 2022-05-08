import { extend } from '../shared'
import { NodeTypes } from './ast'

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string, options = {}) {
  // 将 content 包装至 ctx 中
  const context = createParserContext(content, options)
  return createRoot(parseChildren(context, ''))
}

function parseChildren(context, parentTag) {
  const nodes: any = []
  // parseChildren 应该使用循环来处理
  while (!isEnd(context, parentTag)) {
    const s = context.source
    let node
    if (s.startsWith(context.options.delimiters[0])) {
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      // TODO: 判断条件 startsWith 和 s[0] 的区别是什么
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context)
      }
    }
    if (!node) {
      node = parseText(context)
    }
    nodes.push(node)
  }

  return nodes
}

function isEnd(context: any, parentTag) {
  // 结束标签
  if (parentTag && context.source.startsWith(`</${parentTag}>`)) {
    return true
  }
  // context.source 为空
  return !context.source
}

function parseText(context: any): any {
  let endTokens = ['<', context.options.delimiters[0]]
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    // endIndex 应该尽量小
    if (index !== -1 && index < endIndex) {
      endIndex = index
    }
  }
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function parseTextData(context: any, length: number): any {
  const content = context.source.slice(0, length)
  advanceBy(context, length)
  return content
}

function parseElement(context: any): any {
  // StartTag
  const element = parseTag(context, TagType.Start)
  // parseEl 的时候应该也要 递归 parseChildren
  // 否则就变成只解析一个 tag 了
  element.children = parseChildren(context, element.tag)
  // EndTag
  parseTag(context, TagType.End)
  return element
}

function parseTag(context, type: TagType): any {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match[1]
  advanceBy(context, match[0].length + 1)
  if (type === TagType.End) return

  return {
    type: NodeTypes.ELEMENT,
    tag,
  }
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

  const rawContent = parseTextData(context, rawContentLength)
  const content = rawContent.trim()
  advanceBy(context, closeDelimiter.length)

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
