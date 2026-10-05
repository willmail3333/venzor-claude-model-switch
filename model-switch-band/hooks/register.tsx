import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Rec } from '../types'

const rec = atom({ plugin: 'model-switch-band', key: 'rec' } as const, null)
const isHidden = atom({ plugin: 'model-switch-band', key: 'isHidden' } as const, false)
const applied = atom({ plugin: 'model-switch-band', key: 'applied' } as const, null)

// The app's own menus, driven by its shortcuts: Cmd+Shift+I opens the model
// menu (1 Opus, 2 Fable, 3 Sonnet, 4 Haiku), Cmd+Shift+E the effort slider
// (Home, then one Right per stop: low, medium, high, xhigh, max).
const MODEL_KEY: Record<string, string> = { opus: '1', fable: '2', sonnet: '3', haiku: '4' }
const EFFORT_STEPS: Record<string, number> = { low: 0, medium: 1, high: 2, xhigh: 3, max: 4 }

const script = (r: Rec, isSameModel: boolean): string => {
  const lines = ['tell application "Claude" to activate', 'delay 0.25', 'tell application "System Events" to tell process "Claude"']
  const key = MODEL_KEY[r.alias]
  if (key && !isSameModel) {
    lines.push('keystroke "i" using {command down, shift down}', 'delay 0.7', `keystroke "${key}"`, 'delay 0.7')
  }
  if (r.effort && r.effort in EFFORT_STEPS) {
    lines.push('keystroke "e" using {command down, shift down}', 'delay 0.7', 'key code 115', 'delay 0.15')
    for (let i = 0; i < EFFORT_STEPS[r.effort]!; i++) lines.push('key code 124', 'delay 0.15')
    lines.push('delay 0.4', 'keystroke "e" using {command down, shift down}')
  }
  lines.push('end tell')
  return lines.join('\n')
}

// Reads the last "Model for next step: Opus 5.5, high effort" line of a reply.
const parse = (answer: string): Rec | null => {
  const lines = answer.split('\n').filter(l => /model for next step/i.test(l))
  const line = lines[lines.length - 1]
  if (!line) return null
  const alias = /(opus|sonnet|haiku|fable)/i.exec(line)?.[1]?.toLowerCase()
  if (!alias) return null
  const version = new RegExp(`${alias}\\s*([\\d.]+)`, 'i').exec(line)?.[1]?.replace(/\.$/, '')
  const effort = /(xhigh|low|medium|high|max)\s*effort/i.exec(line)?.[1]?.toLowerCase() ?? null
  const name = alias.charAt(0).toUpperCase() + alias.slice(1) + (version ? ` ${version}` : '')
  return { alias, name, effort }
}

export const register: Register = on => {
  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      const found = parse(e.answer)
      await update($, rec, () => found)
      await update($, isHidden, () => false)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, rec)
    if (e.props.hasSurvey || e.props.isWorking || r === null || (await read($, isHidden))) {
      return next(e)
    }
    const current = (await $.session.model()).toLowerCase()
    const last = await read($, applied)
    const isSameModel = current.includes(r.alias)
    const isSameEffort = r.effort === null || last === r.effort
    if (isSameModel && isSameEffort) {
      return next(e)
    }
    const { Box, Button, Text } = $.ui.resolve(e)
    const label = `Switch to ${r.name}${r.effort ? `, ${r.effort} effort` : ''}`
    return (
      <Box>
        <Text dimColor>Recommended: </Text>
        <Button
          key="switch"
          label={label}
          onPress={async () => {
            try {
              const out = await $.process.run(['/usr/bin/osascript', '-e', script(r, isSameModel)], { timeoutMs: 20000 })
              if (out.exitCode !== 0) throw new Error(out.stderr.trim() || `exit ${out.exitCode}`)
              await update($, applied, () => r.effort)
              $.ui.toast(`Switched to ${r.name}${r.effort ? `, ${r.effort} effort` : ''}`)
              await update($, isHidden, () => true)
            } catch (err) {
              $.ui.toast(`Could not switch: ${String(err)}`)
            }
          }}
        />
        <Text> </Text>
        <Button key="hide" label="Dismiss" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
