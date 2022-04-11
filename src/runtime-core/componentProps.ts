export function initProps(instance, rawProps) {
  // instance.vnode.props 可能为 props 或者 undefined -> {}
  instance.props = rawProps || {}
  // TODO: attrs
}
