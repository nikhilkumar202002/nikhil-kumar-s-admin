import { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react'
import authService from '../../utils/auth.service'

interface ChangePasswordProps {
  onCancel?: () => void
  onSuccess?: () => void
}

export default function ChangePassword({
  onCancel,
  onSuccess,
}: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)

    if (!currentPassword) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your current password.',
      })
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'New passwords do not match.',
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      })

      setStatusMessage({
        type: 'success',
        text: res.message || 'Password changed successfully!',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      if (onSuccess) {
        setTimeout(onSuccess, 1500)
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setStatusMessage({
        type: 'error',
        text:
          errorObj.message ||
          'Failed to update password. Please check your current password.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-zinc-400" />
              <span>Change Password</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Update your administrator credentials with a new secure password.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {statusMessage?.type === 'error' && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2.5 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {statusMessage?.type === 'success' && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Change Password Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5 shadow-xl"
      >
        {/* Current Password */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Current Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:bg-zinc-900 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:bg-zinc-900 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:bg-zinc-900 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800/80">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-950 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 active:scale-95 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

