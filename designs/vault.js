import { drawCore } from './terrain.js'
const canvas = document.querySelector('canvas')
new ResizeObserver(() => drawCore(canvas)).observe(canvas)
