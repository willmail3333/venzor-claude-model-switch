export type Rec = { alias: string; name: string; effort: string | null }

declare module 'claude-code' {
  interface PluginState {
    'model-switch-band': { rec: Rec | null; isHidden: boolean; applied: string | null }
  }
}
