import { useState, useEffect } from 'react'
import Login from './pages/auth/Login'
import Sidebar from './component/layout/Sidebar'
import Header from './component/layout/Header'
import MainDashboard from './pages/dashboard/MainDashboard'
import ProjectsList from './pages/projects/ProjectsList'
import ProjectForm from './pages/projects/ProjectForm'
import authService from './utils/auth.service'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    authService.isAuthenticated()
  )
  const [activeMenuId, setActiveMenuId] = useState<string>('dashboard')
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated())
    }
    window.addEventListener('storage', handleAuthChange)
    return () => window.removeEventListener('storage', handleAuthChange)
  }, [])

  const getPageTitle = (id: string) => {
    switch (id) {
      case 'dashboard':
        return 'Dashboard Overview'
      case 'projects':
      case 'projects-all':
        return 'Portfolio Projects'
      case 'projects-add':
        return 'Add New Project'
      case 'projects-edit':
        return 'Edit Project'
      case 'projects-categories':
        return 'Project Categories'
      default:
        return id.replace('-', ' ')
    }
  }

  const renderContent = () => {
    switch (activeMenuId) {
      case 'dashboard':
        return (
          <MainDashboard
            onAddProject={() => {
              setEditingProjectId(null)
              setActiveMenuId('projects-add')
            }}
            onEditProject={(id) => {
              setEditingProjectId(id)
              setActiveMenuId('projects-edit')
            }}
            onViewAllProjects={() => setActiveMenuId('projects-all')}
          />
        )

      case 'projects':
      case 'projects-all':
      case 'projects-categories':
        return (
          <ProjectsList
            onAddProject={() => {
              setEditingProjectId(null)
              setActiveMenuId('projects-add')
            }}
            onEditProject={(id) => {
              setEditingProjectId(id)
              setActiveMenuId('projects-edit')
            }}
          />
        )

      case 'projects-add':
        return (
          <ProjectForm
            projectId={null}
            onCancel={() => setActiveMenuId('projects-all')}
            onSuccess={() => setActiveMenuId('projects-all')}
          />
        )

      case 'projects-edit':
        return (
          <ProjectForm
            projectId={editingProjectId}
            onCancel={() => setActiveMenuId('projects-all')}
            onSuccess={() => setActiveMenuId('projects-all')}
          />
        )

      default:
        return (
          <MainDashboard
            onAddProject={() => {
              setEditingProjectId(null)
              setActiveMenuId('projects-add')
            }}
            onEditProject={(id) => {
              setEditingProjectId(id)
              setActiveMenuId('projects-edit')
            }}
            onViewAllProjects={() => setActiveMenuId('projects-all')}
          />
        )
    }
  }

  // If authenticated, render Admin Panel Layout with Sidebar, Header & Main content
  if (isAuthenticated) {
    return (
      <div className="flex h-screen w-full bg-black text-zinc-100 overflow-hidden font-sans">
        <Sidebar
          activeId={activeMenuId}
          onSelect={(id) => {
            if (id === 'projects-add') {
              setEditingProjectId(null)
            }
            setActiveMenuId(id)
          }}
          onLogout={() => {
            authService.logout()
            setIsAuthenticated(false)
          }}
        />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header
            pageTitle={getPageTitle(activeMenuId)}
            onNavigate={(id) => {
              if (id === 'projects-add') {
                setEditingProjectId(null)
              }
              setActiveMenuId(id)
            }}
            onLogout={() => {
              authService.logout()
              setIsAuthenticated(false)
            }}
          />
          <main className="flex-1 overflow-y-auto bg-black">
            {renderContent()}
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