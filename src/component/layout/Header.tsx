import { useState, useEffect, useRef } from 'react'
import authService, { type User } from '../../utils/auth.service'
import {
  Search,
  Bell,
  ExternalLink,
  ChevronDown,
  User as UserIcon,
  Lock,
  Settings,
  Activity,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Briefcase,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react'

interface HeaderProps {
  pageTitle?: string
  onToggleSidebar?: () => void
  onNavigate?: (id: string) => void
  onLogout?: () => void
}

export default function Header({
  pageTitle = 'Dashboard Overview',
  onToggleSidebar,
  onNavigate,
  onLogout,
}: HeaderProps) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser())
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync user details on mount
  useEffect(() => {
    authService
      .getCurrentUser()
      .then((data) => setUser(data))
      .catch(() => {
        // Fallback to cached user
      })
  }, [])

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsProfileOpen(false)
        setIsNotificationsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle Logout
  const handleLogoutAction = () => {
    setIsProfileOpen(false)
    authService.logout()
    if (onLogout) {
      onLogout()
    } else {
      window.location.reload()
    }
  }

  // Quick navigation search items
  const quickActions = [
    { id: 'projects', label: 'Portfolio Projects', category: 'Content', icon: Briefcase },
    { id: 'blog', label: 'Blog Posts', category: 'Content', icon: FileText },
    { id: 'contact', label: 'Contact Inquiries', category: 'Inbox', icon: MessageSquare },
    { id: 'settings', label: 'Site Settings', category: 'System', icon: Settings },
    { id: 'logs', label: 'Activity & Audit Logs', category: 'Security', icon: Activity },
  ]

  const filteredQuickActions = quickActions.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const notifications = [
    {
      id: 1,
      title: 'New Client Inquiry',
      desc: 'Sarah Jenkins (Tech Recruiter @ Stripe) sent a message',
      time: '2h ago',
      unread: true,
    },
    {
      id: 2,
      title: 'System Milestone',
      desc: 'Portfolio reached 24,000 monthly impressions',
      time: '5h ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Deployment Live',
      desc: 'AI Workflow Platform v2.4 successfully published',
      time: 'Yesterday',
      unread: false,
    },
  ]

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NK'

  return (
    <header className="h-16 px-4 sm:px-6 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between text-zinc-100 flex-shrink-0 z-30 font-sans relative">
      
      {/* Left: Mobile Toggle & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="hidden sm:inline">Admin</span>
          <span className="hidden sm:inline">/</span>
          <span className="text-zinc-200 font-semibold tracking-tight">{pageTitle}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-xs sm:max-w-md md:max-w-lg mx-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            placeholder="Search projects, blogs, skills, messages... (⌘K)"
            className="w-full pl-9 pr-14 py-2 bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 focus:border-zinc-700 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <kbd className="hidden sm:inline-block text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/60 pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Global Search Dropdown Results */}
        {isSearchOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Quick Navigation</span>
              <span>ESC to close</span>
            </div>

            {filteredQuickActions.length > 0 ? (
              filteredQuickActions.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false)
                      onNavigate?.(item.id)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-900/90 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800/80">
                      {item.category}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500">
                No matching results for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Live Link, Notifications & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        
        {/* View Live Portfolio Link */}
        <a
          href="https://nikhil.dev"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
        >
          <span>Live Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </a>

        {/* Notifications Dropdown */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen)
              setIsProfileOpen(false)
            }}
            title="Notifications"
            className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    2 New
                  </span>
                </div>
                <button
                  type="button"
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              </div>

              <div className="divide-y divide-zinc-900 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors cursor-pointer ${
                      n.unread ? 'bg-zinc-900/40 hover:bg-zinc-900/70' : 'hover:bg-zinc-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{n.title}</span>
                      <span className="text-[10px] text-zinc-500">{n.time}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-2.5 border-t border-zinc-900 bg-zinc-950/60 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false)
                    onNavigate?.('contact')
                  }}
                  className="text-xs text-zinc-400 hover:text-white font-medium cursor-pointer"
                >
                  View all in Contact Inbox →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen)
              setIsNotificationsOpen(false)
            }}
            className="flex items-center gap-2.5 p-1 sm:pl-1.5 sm:pr-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer select-none"
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
          >
            {/* Avatar Pill */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center font-bold text-xs text-white shadow-inner flex-shrink-0">
              {initials}
            </div>

            {/* Name & Role (hidden on small screens) */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-200 leading-tight truncate max-w-[120px]">
                {user?.name || 'Nikhil Kumar'}
              </span>
              <span className="text-[10px] text-zinc-500 capitalize leading-tight">
                {user?.role ? user.role.replace('_', ' ') : 'Super Admin'}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
              {/* User Header Details */}
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/60 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center font-bold text-xs text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">
                      {user?.name || 'Nikhil Kumar'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {user?.email || 'nikhilkumars12343@gmail.com'}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">Role</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    {user?.is_super_admin ? 'Super Admin' : user?.role || 'Admin'}
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false)
                    onNavigate?.('profile-me')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false)
                    onNavigate?.('profile-password')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false)
                    onNavigate?.('settings-general')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Site Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false)
                    onNavigate?.('logs-activity')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-zinc-400" />
                  <span>Activity Logs</span>
                </button>
              </div>

              {/* Sign Out Divider & Button */}
              <div className="pt-1 mt-1 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleLogoutAction}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  )
}