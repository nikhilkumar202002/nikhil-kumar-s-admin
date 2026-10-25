import { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import authService from '../../utils/auth.service'

export default function Login() {
  const [isDark, setIsDark] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password.trim()) {
      setLoginStatus('error')
      setErrorMessage('Please enter both your email and password.')
      return
    }

    setIsLoading(true)
    setLoginStatus('idle')

    try {
      await authService.login({
        email: email.trim(),
        password: password.trim(),
      })
      
      setLoginStatus('success')

      // Fetch user profile to verify token and cache user details
      try {
        await authService.getCurrentUser()
      } catch {
        // Non-blocking if /users/me response structure differs
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setLoginStatus('error')
      setErrorMessage(errorObj.message || 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans relative">
        
        {/* Subtle Theme Toggle in Top-Right Corner */}
        <button
          type="button"
          onClick={() => setIsDark(!isDark)}
          className="absolute top-6 right-6 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Center-Aligned Form Container */}
        <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs dark:shadow-2xl transition-all">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Welcome back. Please enter your credentials to access your account.
            </p>
          </div>

          {/* Error / Alert feedback */}
          {loginStatus === 'error' && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loginStatus === 'success' && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Authentication successful. Redirecting...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5"
              >
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
                >
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white dark:bg-zinc-900 dark:checked:bg-white transition-all cursor-pointer accent-zinc-900 dark:accent-white"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Keep me signed in for 30 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}