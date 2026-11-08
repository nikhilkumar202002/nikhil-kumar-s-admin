import { useState, useEffect } from 'react'
import Login from './pages/auth/Login'
import Sidebar from './component/layout/Sidebar'
import Header from './component/layout/Header'
import MainDashboard from './pages/dashboard/MainDashboard'
import ProjectsList from './pages/projects/ProjectsList'
import ProjectForm from './pages/projects/ProjectForm'
import ProjectCategories from './pages/projects/ProjectCategories'
import ProjectTechnology from './pages/projects/ProjectTechnology'
import ChangePassword from './pages/auth/ChangePassword'
import ProfileView from './pages/auth/ProfileView'
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
      case 'projects-technologies':
      case 'technologies':
        return 'Technologies & Skills'
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

      case 'projects-categories':
        return (
          <ProjectCategories
            onAddProject={() => {
              setEditingProjectId(null)
              setActiveMenuId('projects-add')
            }}
          />
        )

      case 'projects-technologies':
      case 'technologies':
      case 'skills':
      case 'skills-all':
        return (
          <ProjectTechnology
            onAddProject={() => {
              setEditingProjectId(null)
              setActiveMenuId('projects-add')
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

      case 'profile-me':
        return (
          <ProfileView
            onChangePassword={() => setActiveMenuId('profile-password')}
          />
        )

      case 'profile-password':
        return (
          <ChangePassword
            onCancel={() => setActiveMenuId('dashboard')}
            onSuccess={() => setActiveMenuId('dashboard')}
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

  // Login Page
  return (
    <div className="w-full min-h-screen relative bg-zinc-950">
      <Login />
    </div>
  )
}