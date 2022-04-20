import { capitalize } from '../shared'
// 1. 拿到 onEvent
// 2. onEvent && onEvent()
export function emit(instance, event) {
  // 在子组件实例的 props 中应该存在 onEvent 事件
  const { props } = instance

  const toHandleKey = (str) => (str ? `on${capitalize(event)}` : '')
  const handleName = toHandleKey(event)

  const handler = props[handleName]
  handler && handler()
}
