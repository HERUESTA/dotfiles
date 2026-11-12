export type Motion = { pattern: number; step: number }

declare module 'claude-code' {
  interface PluginState {
    'peek-spinner': { motion: Shaped<Motion> }
  }
}
