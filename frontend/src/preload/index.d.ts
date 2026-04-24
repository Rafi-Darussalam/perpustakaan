import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    appApi: {
      closeApp: () => void
      maximize: () => void
      minimize: () => void
      close: () => void
      getWindowState: () => Promise<{ isMaximized: boolean }>
    }
  }
}
