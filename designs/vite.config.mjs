import { defineConfig } from 'vite'
import { globSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('.', import.meta.url))
export default defineConfig({base:"./",build:{rollupOptions:{input:globSync('**/index.html',{cwd:root,exclude:['dist/**']}).map(path=>root+path)}}})
