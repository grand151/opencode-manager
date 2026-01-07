/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SERVER_PORT?: string
  readonly VITE_OPENCODE_PORT?: string
  readonly VITE_MAX_FILE_SIZE_MB?: string
  readonly VITE_MAX_UPLOAD_SIZE_MB?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
