/*
 * root = {
 *   children: [
 *     {
 *       type: 0
 *       content: {type: 1, content: 'message'}
 *     },
 *   ],
 * }
 */

import { NodeTypes } from '../ast'

export function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content)
  }
}

function processExpression(node) {
  const raw = node.content
  node.content = `_ctx.${raw}`
  return node
}
