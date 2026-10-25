import { useState, useEffect } from 'react'
import Login from './pages/auth/Login'
import Sidebar from './component/layout/Sidebar'
import Header from './component/layout/Header'
import MainDashboard from './pages/dashboard/MainDashboard'
import authService from './utils/auth.service'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    authService.isAuthenticated()
  )
  const [activeMenuId, setActiveMenuId] = useState<string>('dashboard')

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated())
    }
    window.addEventListener('storage', handleAuthChange)
    return () => window.removeEventListener('storage', handleAuthChange)
  }, [])

  // If authenticated, render Admin Panel Layout with Sidebar, Header & MainDashboard
  if (isAuthenticated) {
    return (
      <div className="flex h-screen w-full bg-black text-zinc-100 overflow-hidden font-sans">
        <Sidebar
          activeId={activeMenuId}
          onSelect={(id) => setActiveMenuId(id)}
          onLogout={() => {
            authService.logout()
            setIsAuthenticated(false)
          }}
        />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header
            pageTitle={
              activeMenuId === 'dashboard'
                ? 'Dashboard Overview'
                : activeMenuId.replace('-', ' ')
            }
            onNavigate={(id) => setActiveMenuId(id)}
            onLogout={() => {
              authService.logout()
              setIsAuthenticated(false)
            }}
          />
          <main className="flex-1 overflow-y-auto bg-black">
            <MainDashboard />
          </main>
        </div>
      </div>
    )
  }

  // Login Page with quick preview toggle to view the dashboard directly
  return (
    <div className="w-full min-h-screen relative bg-zinc-950">
      <div className="absolute top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setIsAuthenticated(true)}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <span>Preview Dashboard</span>
          <span>→</span>
        </button>
      </div>
      <Login />
    </div>
  )
}