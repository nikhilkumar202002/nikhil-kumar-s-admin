import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Code2,
  Building2,
  GraduationCap,
  FileText,
  Globe,
  Image,
  Inbox,
  Settings,
  Activity,
  User,
  LogOut,
  ChevronDown,
  Search,
} from 'lucide-react'

interface SubMenuItem {
  id: string
  label: string
  badge?: string | number
}

interface MenuItem {
  id: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string | number
  subItems?: SubMenuItem[]
}

interface MenuSection {
  title?: string
  items: MenuItem[]
}

interface SidebarProps {
  activeId?: string
  onSelect?: (id: string) => void
  onLogout?: () => void
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({
  activeId = 'dashboard',
  onSelect,
  onLogout,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const [currentActive, setCurrentActive] = useState(activeId)
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    projects: true,
    blog: false,
    contact: true,
  })

  const menuSections: MenuSection[] = [
    {
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Portfolio & Content',
      items: [
        {
          id: 'projects',
          label: 'Portfolio Projects',
          icon: Briefcase,
          subItems: [
            { id: 'projects-all', label: 'All Projects' },
            { id: 'projects-add', label: 'Add Project' },
            { id: 'projects-categories', label: 'Categories' },
          ],
        },
        {
          id: 'skills',
          label: 'Skills',
          icon: Code2,
          subItems: [
            { id: 'skills-all', label: 'All Skills' },
            { id: 'skills-add', label: 'Add Skill' },
            { id: 'skills-categories', label: 'Skill Categories' },
          ],
        },
        {
          id: 'experience',
          label: 'Experience',
          icon: Building2,
          subItems: [
            { id: 'experience-work', label: 'Work Experience' },
            { id: 'experience-add', label: 'Add Experience' },
          ],
        },
        {
          id: 'education',
          label: 'Education',
          icon: GraduationCap,
          subItems: [
            { id: 'education-all', label: 'All Education' },
            { id: 'education-add', label: 'Add Education' },
          ],
        },
        {
          id: 'blog',
          label: 'Blog Management',
          icon: FileText,
          subItems: [
            { id: 'blog-posts', label: 'All Posts' },
            { id: 'blog-add', label: 'Add Post' },
            { id: 'blog-categories', label: 'Categories' },
            { id: 'blog-tags', label: 'Tags' },
          ],
        },
        {
          id: 'media',
          label: 'Media Library',
          icon: Image,
          subItems: [
            { id: 'media-all', label: 'All Media' },
            { id: 'media-upload', label: 'Upload Media' },
          ],
        },
      ],
    },
    {
      title: 'Optimization & Comms',
      items: [
        {
          id: 'seo',
          label: 'SEO Management',
          icon: Globe,
          subItems: [
            { id: 'seo-overview', label: 'SEO Overview' },
            { id: 'seo-meta', label: 'Meta Defaults' },
            { id: 'seo-sitemap', label: 'Sitemap' },
            { id: 'seo-robots', label: 'Robots.txt' },
            { id: 'seo-redirects', label: 'Redirects' },
          ],
        },
        {
          id: 'contact',
          label: 'Contact Messages',
          icon: Inbox,
          badge: '3',
          subItems: [
            { id: 'contact-inbox', label: 'Inbox', badge: '3' },
            { id: 'contact-read', label: 'Read' },
            { id: 'contact-archived', label: 'Archived' },
          ],
        },
      ],
    },
    {
      title: 'Preferences & System',
      items: [
        {
          id: 'settings',
          label: 'Site Settings',
          icon: Settings,
          subItems: [
            { id: 'settings-general', label: 'General Settings' },
            { id: 'settings-social', label: 'Social Links' },
            { id: 'settings-contact', label: 'Contact Details' },
          ],
        },
        {
          id: 'logs',
          label: 'Activity Logs',
          icon: Activity,
          subItems: [
            { id: 'logs-activity', label: 'User Activity' },
            { id: 'logs-security', label: 'Security Events' },
          ],
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          subItems: [
            { id: 'profile-me', label: 'My Profile' },
            { id: 'profile-password', label: 'Change Password' },
          ],
        },
      ],
    },
  ]

  const toggleSubmenu = (menuId: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
  }

  const handleItemClick = (id: string, hasChildren = false) => {
    if (hasChildren) {
      toggleSubmenu(id)
      return
    }
    setCurrentActive(id)
    onSelect?.(id)
    onClose?.()
  }

  // Filter items if user types in search
  const filteredSections = menuSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const matchesParent = item.label.toLowerCase().includes(query)
      const matchesChild = item.subItems?.some((sub) =>
        sub.label.toLowerCase().includes(query)
      )
      return matchesParent || matchesChild
    }),
  })).filter((section) => section.items.length > 0)

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-72 flex-shrink-0 flex flex-col bg-black text-zinc-300 border-r border-zinc-800/80 select-none transition-transform duration-300 ease-in-out font-sans ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-zinc-800 via-zinc-700 to-zinc-600 border border-zinc-700/60 flex items-center justify-center shadow-inner">
            <span className="font-extrabold text-white text-base tracking-wider">▲</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">Portfolio Admin</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">v2.4 • System Live</span>
          </div>
        </div>
      </div>

      {/* Quick Search Input */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full pl-9 pr-8 py-1.5 bg-zinc-900/70 border border-zinc-800/90 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Navigation Scrollable Area */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {filteredSections.map((section, sIndex) => (
          <div key={sIndex} className="space-y-1">
            {section.title && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {section.title}
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const hasChildren = Boolean(item.subItems && item.subItems.length > 0)
                const isExpanded = openMenus[item.id] ?? false
                const isItemActive = currentActive === item.id
                const isChildActive = item.subItems?.some((sub) => sub.id === currentActive)

                return (
                  <div key={item.id} className="space-y-0.5">
                    {/* Menu Item Button */}
                    <button
                      type="button"
                      onClick={() => handleItemClick(item.id, hasChildren)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                        isItemActive
                          ? 'bg-zinc-800/90 text-white shadow-xs border border-zinc-700/50'
                          : isChildActive
                          ? 'text-white bg-zinc-900/80'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isItemActive || isChildActive
                              ? 'text-white'
                              : 'text-zinc-500 group-hover:text-zinc-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                        {hasChildren && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-zinc-300' : ''
                            }`}
                          />
                        )}
                      </div>
                    </button>

                    {/* Submenu List */}
                    {hasChildren && isExpanded && (
                      <div className="relative pl-6 pr-1 py-1 space-y-0.5">
                        {/* Connecting vertical hairline */}
                        <div className="absolute left-4.5 top-1 bottom-1 w-px bg-zinc-800/80" />

                        {item.subItems!.map((sub) => {
                          const isSubActive = currentActive === sub.id
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleItemClick(sub.id, false)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                                isSubActive
                                  ? 'text-white font-medium bg-zinc-800/70 border border-zinc-700/40'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                              {sub.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-medium bg-emerald-500/20 text-emerald-400">
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Card & Logout Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-900/80 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
              NK
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-zinc-200 truncate">Nikhil Kumar</span>
              <span className="text-[10px] text-zinc-500 truncate">admin@portfolio.dev</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}