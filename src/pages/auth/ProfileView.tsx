import { useState, useEffect } from 'react'
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Calendar,
  Clock,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  IdCard,
} from 'lucide-react'
import authService, { type User } from '../../utils/auth.service'

interface ProfileViewProps {
  onChangePassword?: () => void
}

export default function ProfileView({ onChangePassword }: ProfileViewProps) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser())
  const [isLoading, setIsLoading] = useState(false)
  const [successBanner, setSuccessBanner] = useState('')

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const data = await authService.getCurrentUser()
      setUser(data)
      setSuccessBanner('Profile refreshed successfully')
      setTimeout(() => setSuccessBanner(''), 3000)
    } catch {
      // Keep cached user if network fails
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NK'

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <UserIcon className="w-6 h-6 text-zinc-400" />
            <span>Administrator Profile</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage and view your administrator account credentials and access details.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProfile}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Profile"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-6">
        {/* User Hero Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-600 flex items-center justify-center font-bold text-xl text-white shadow-inner flex-shrink-0 border border-zinc-700/60">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {user?.name || 'Nikhil Kumar'}
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{user?.email || 'nikhilkumars12343@gmail.com'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>{user?.role || 'Super Admin'}</span>
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* User ID */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <IdCard className="w-3.5 h-3.5" />
              <span>Account ID</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              #{user?.id ?? '62'}
            </div>
          </div>

          {/* Role */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Access Role</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {user?.role ? user.role.replace('_', ' ') : 'Super Administrator'}
            </div>
          </div>

          {/* Created At */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Account Created</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {formatDate(user?.created_at)}
            </div>
          </div>

          {/* Last Login */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Login</span>
            </div>
            <div className="text-sm font-semibold text-zinc-200">
              {formatDate(user?.last_login_at)}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Security: JWT authentication session active.
          </p>

          {onChangePassword && (
            <button
              type="button"
              onClick={onChangePassword}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white border border-zinc-700/80 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <KeyRound className="w-4 h-4 text-zinc-400" />
              <span>Change Password</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
