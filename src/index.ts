import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom'
import { registerRuntimeCompiler } from './runtime-core'

export * from './runtime-dom'

function compileToFunction(template) {
  const { code } = baseCompile(template)
  // tmpl : const { toDisplayString: _toDisplayString} = Vue -> runtimeDom
  const render = new Function('Vue', code)(runtimeDom)
  return render
}

registerRuntimeCompiler(compileToFunction)
