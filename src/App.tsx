import { useState, useEffect, useCallback } from 'react'
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

const STORAGE_KEY_MENU = 'admin_active_menu'
const STORAGE_KEY_PROJECT_ID = 'admin_editing_project_id'

interface RouteState {
  menuId: string
  projectId: number | null
}

/**
 * Parses the current active route from URL hash, pathname, or localStorage.
 * Ensures that refreshing the browser stays on the current page instead of redirecting to dashboard.
 */
function parseCurrentRoute(): RouteState {
  try {
    // 1. Check window.location.hash (e.g. "#/projects-categories", "#/projects-edit?id=47")
    const hash = window.location.hash.replace(/^#\/?/, '').trim()
    if (hash) {
      const [path, queryString] = hash.split('?')
      const params = new URLSearchParams(queryString || '')
      const idParam = params.get('id')
      const projectId = idParam ? Number(idParam) : null

      if (path) {
        return {
          menuId: path,
          projectId: Number.isNaN(projectId) ? null : projectId,
        }
      }
    }

    // 2. Check window.location.pathname (e.g. "/projects-categories", "/projects/edit/47")
    const pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').trim()
    if (pathname && pathname !== 'index.html' && pathname !== 'dashboard') {
      const parts = pathname.split('/')
      if (parts[0] === 'projects' && parts[1] === 'edit' && parts[2]) {
        const pId = Number(parts[2])
        return {
          menuId: 'projects-edit',
          projectId: Number.isNaN(pId) ? null : pId,
        }
      }

      const params = new URLSearchParams(window.location.search)
      const idParam = params.get('id')
      const projectId = idParam ? Number(idParam) : null

      return {
        menuId: parts[0],
        projectId: Number.isNaN(projectId) ? null : projectId,
      }
    }

    // 3. Check localStorage fallback
    const storedMenu = localStorage.getItem(STORAGE_KEY_MENU)
    const storedProjectId = localStorage.getItem(STORAGE_KEY_PROJECT_ID)
    if (storedMenu) {
      const parsedId = storedProjectId ? Number(storedProjectId) : null
      return {
        menuId: storedMenu,
        projectId: Number.isNaN(parsedId) ? null : parsedId,
      }
    }
  } catch (err) {
    console.error('Failed to parse current route:', err)
  }

  // 4. Default to dashboard
  return {
    menuId: 'dashboard',
    projectId: null,
  }
}

/**
 * Syncs the route state to localStorage and the browser URL hash.
 */
function syncRouteToBrowser(menuId: string, projectId: number | null = null, replace = false) {
  try {
    localStorage.setItem(STORAGE_KEY_MENU, menuId)
    if (projectId !== null && !Number.isNaN(projectId)) {
      localStorage.setItem(STORAGE_KEY_PROJECT_ID, String(projectId))
    } else {
      localStorage.removeItem(STORAGE_KEY_PROJECT_ID)
    }

    let targetHash = `#/${menuId}`
    if (projectId !== null && !Number.isNaN(projectId)) {
      targetHash += `?id=${projectId}`
    }

    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState(null, '', targetHash)
      } else {
        window.history.pushState(null, '', targetHash)
      }
    }
  } catch (err) {
    console.error('Failed to sync route to browser:', err)
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    authService.isAuthenticated()
  )

  // Initialize directly from URL hash or localStorage so refreshing maintains the exact page
  const initialRoute = parseCurrentRoute()
  const [activeMenuId, setActiveMenuId] = useState<string>(initialRoute.menuId)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(initialRoute.projectId)

  // Unified navigation handler
  const navigate = useCallback((menuId: string, projectId: number | null = null) => {
    setActiveMenuId(menuId)
    setEditingProjectId(projectId)
    syncRouteToBrowser(menuId, projectId)
  }, [])

  // Sync with browser Back/Forward buttons and hash changes
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute()
      setActiveMenuId(route.menuId)
      setEditingProjectId(route.projectId)
    }

    window.addEventListener('hashchange', handlePopState)
    window.addEventListener('popstate', handlePopState)

    // Ensure initial URL hash matches the restored state
    syncRouteToBrowser(activeMenuId, editingProjectId, true)

    return () => {
      window.removeEventListener('hashchange', handlePopState)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [activeMenuId, editingProjectId])

  // Listen for auth changes across storage events
  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated())
    }
    window.addEventListener('storage', handleAuthChange)
    return () => window.removeEventListener('storage', handleAuthChange)
  }, [])

  const handleLogout = () => {
    authService.logout()
    localStorage.removeItem(STORAGE_KEY_MENU)
    localStorage.removeItem(STORAGE_KEY_PROJECT_ID)
    setIsAuthenticated(false)
    window.location.hash = ''
  }

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
      case 'skills':
      case 'skills-all':
        return 'Technologies & Skills'
      case 'profile-me':
        return 'Admin Profile'
      case 'profile-password':
        return 'Change Password'
      default:
        return id.replace('-', ' ')
    }
  }

  const renderContent = () => {
    switch (activeMenuId) {
      case 'dashboard':
        return (
          <MainDashboard
            onAddProject={() => navigate('projects-add')}
            onEditProject={(id) => navigate('projects-edit', id)}
            onViewAllProjects={() => navigate('projects-all')}
          />
        )

      case 'projects':
      case 'projects-all':
        return (
          <ProjectsList
            onAddProject={() => navigate('projects-add')}
            onEditProject={(id) => navigate('projects-edit', id)}
          />
        )

      case 'projects-categories':
        return (
          <ProjectCategories
            onAddProject={() => navigate('projects-add')}
          />
        )

      case 'projects-technologies':
      case 'technologies':
      case 'skills':
      case 'skills-all':
        return (
          <ProjectTechnology
            onAddProject={() => navigate('projects-add')}
          />
        )

      case 'projects-add':
        return (
          <ProjectForm
            projectId={null}
            onCancel={() => navigate('projects-all')}
            onSuccess={() => navigate('projects-all')}
          />
        )

      case 'projects-edit':
        return (
          <ProjectForm
            projectId={editingProjectId}
            onCancel={() => navigate('projects-all')}
            onSuccess={() => navigate('projects-all')}
          />
        )

      case 'profile-me':
        return (
          <ProfileView
            onChangePassword={() => navigate('profile-password')}
          />
        )

      case 'profile-password':
        return (
          <ChangePassword
            onCancel={() => navigate('dashboard')}
            onSuccess={() => navigate('dashboard')}
          />
        )

      default:
        return (
          <MainDashboard
            onAddProject={() => navigate('projects-add')}
            onEditProject={(id) => navigate('projects-edit', id)}
            onViewAllProjects={() => navigate('projects-all')}
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
              navigate('projects-add', null)
            } else {
              navigate(id)
            }
          }}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header
            pageTitle={getPageTitle(activeMenuId)}
            onNavigate={(id) => {
              if (id === 'projects-add') {
                navigate('projects-add', null)
              } else {
                navigate(id)
              }
            }}
            onLogout={handleLogout}
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
