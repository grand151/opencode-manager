import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Repos } from './pages/Repos'
import { RepoDetail } from './pages/RepoDetail'
import { SessionDetail } from './pages/SessionDetail'
import { Login } from './pages/Login'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { useSettingsDialog } from './hooks/useSettingsDialog'
import { useTheme } from './hooks/useTheme'
import { TTSProvider } from './contexts/TTSContext'
import { PermissionProvider } from '@/contexts/PermissionContext'
import { PermissionRequestDialog } from './components/session/PermissionRequestDialog'
import { usePermissionContext } from './contexts/PermissionContext'
import { GlobalPermissionNotification } from './components/permissions/GlobalPermissionNotification'
import { AuthInitializer } from './components/auth/AuthInitializer'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuthStore } from './stores/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      refetchOnWindowFocus: true,
    },
  },
})

function AppContent() {
  const { isOpen, close } = useSettingsDialog()
  const { user, initialized } = useAuthStore()
  useTheme()

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Repos /></ProtectedRoute>} />
        <Route path="/repos/:id" element={<ProtectedRoute><RepoDetail /></ProtectedRoute>} />
        <Route path="/repos/:id/sessions/:sessionId" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      </Routes>
      <GlobalPermissionNotification />
      <SettingsDialog open={isOpen} onOpenChange={close} />
      <Toaster
        position="bottom-right"
        expand={false}
        richColors
        closeButton
      />
    </BrowserRouter>
  )
}

function PermissionDialogWrapper() {
  const {
    currentPermission,
    pendingCount,
    isFromDifferentSession,
    respondToPermission,
    showDialog,
    setShowDialog,
    currentRepoDirectory,
  } = usePermissionContext()

  return (
    <PermissionRequestDialog
      permission={currentPermission}
      pendingCount={pendingCount}
      isFromDifferentSession={isFromDifferentSession}
      onRespond={respondToPermission}
      open={showDialog}
      onOpenChange={setShowDialog}
      repoDirectory={currentRepoDirectory}
    />
  )
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <TTSProvider>
          <PermissionProvider>
            <AppContent />
            <PermissionDialogWrapper />
          </PermissionProvider>
        </TTSProvider>
      </AuthInitializer>
    </QueryClientProvider>
  )
}

export default App
