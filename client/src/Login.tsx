
import { useState } from 'react'
import { apiRequest } from './api'
import './Login.css'

type LoginProps = {
  onLogin: () => void
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await apiRequest(
        isRegistering ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      )

      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="brand-icon">J</div>
          <div>
            <h2>Japan Career</h2>
            <span>TRACKER</span>
          </div>
        </div>

        <h1>{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
        <p>
          {isRegistering
            ? 'Start tracking your career opportunities.'
            : 'Sign in to continue to your dashboard.'}
        </p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="primary-button" disabled={loading}>
          {loading
            ? 'Please wait...'
            : isRegistering
              ? 'Create account'
              : 'Sign in'}
        </button>

        <div className="login-switch">
          {isRegistering
            ? 'Already have an account?'
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError('')
            }}
          >
            {isRegistering ? 'Sign in' : 'Register'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default Login
