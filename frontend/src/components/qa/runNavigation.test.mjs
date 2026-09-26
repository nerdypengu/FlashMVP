import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
let search = new URLSearchParams('run=3&keep=yes')
const Link = () => null
const NodeCard = () => null
const react = { useState: initial => [initial, () => {}], useEffect: () => {} }
const router = {
  Link, useParams: () => ({ projectId: 'proj_9k12b' }),
  useSearchParams: () => [search, update => { search = update(search) }],
}
function load(file) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  runInNewContext(code, { exports, URLSearchParams, document: { body: {} }, require: name => {
    if (name === 'react') return react
    if (name === 'react-router-dom') return router
    if (name === 'react-dom') return { createPortal: children => children }
    if (name === '../../lib/person2Data') return { DEMO_MODE: false }
    if (name === './QANodeCard') return { __esModule: true, default: NodeCard, QAStatusIcon: () => null }
    if (name === './runDemoSteps.js') return { getStageStatus: () => 'passed' }
    if (name === '../../lib/backendApi' || name.endsWith('.css')) return {}
    if (name === './RunDetailInspector') return { __esModule: true, default: () => null }
    return require(name)
  } })
  return exports.default
}
function nodes(node) {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(nodes)
  return [node, ...nodes(node.props?.children)]
}
const run = { run_number: 3, branch: 'main', status: 'PASSED', duration_seconds: 1,
  timestamp: new Date().toISOString(), step_results: [
    { id: 'old-test', name: 'Archived test', stage: 'Archived stage', duration: '1s', status: 'PASSED' },
  ] }
for (const file of ['./RunHistoryTable.tsx', './RunDetailInspector.tsx']) {
  const Component = load(file)
  const tree = nodes(Component({ runs: [run], run, onClose() {} }))
  assert.equal(tree.find(node => node.type === Link).props.to, '/project/proj_9k12b/qa?run=3')
}
const Canvas = load('./QACanvas.tsx')
const render = runs => nodes(Canvas({ projectId: 'proj_9k12b', runs, onRunComplete() {} }))
// Run selection resolves from the URL, including after history data arrives.
assert.equal(render([]).find(node => node.props?.role === 'alert')?.props.children.length > 0, true)
let tree = render([run])
assert.equal(tree.find(node => node.type === NodeCard).props.name, 'Archived test')
assert.equal(tree.find(node => node.props?.['aria-pressed'] === true).props.children[1], 3)
tree.find(node => node.type === 'button' && node.props.children === 'Current pipeline').props.onClick()
assert.equal(search.has('run'), false)
assert.equal(search.get('keep'), 'yes')
tree = render([run])
tree.find(node => node.props?.className === 'qa-run-entry').props.onClick()
assert.equal(search.get('run'), '3')
assert.equal(render([run]).find(node => node.type === NodeCard).props.name, 'Archived test')
search = new URLSearchParams('run=999')
tree = render([run])
assert.ok(tree.some(node => node.props?.role === 'alert'))
assert.equal(tree.some(node => node.type === NodeCard), false)
assert.equal(tree.some(node => node.type === 'button' && node.props.children === 'Run QA'), false)
console.log('PASS: history links, URL selection, archived steps, clear inspection, and missing runs.')
