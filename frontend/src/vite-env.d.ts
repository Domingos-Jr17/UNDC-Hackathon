/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEV_MODE: string
  readonly VITE_DEBUG: string
  readonly VITE_FOLLOW_UP_ALERTS_PHASE2_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
