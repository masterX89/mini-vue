import { App } from './App.js'
import { createApp } from '../../lib/mini-vue.esm.js'
// TODO: change document.querySelector to renderer
const container = document.querySelector('#app')
createApp(App).mount(container)
