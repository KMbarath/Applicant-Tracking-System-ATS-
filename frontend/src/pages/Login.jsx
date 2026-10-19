import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import errorMessage from '../api/errorMessage';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegistering) {
        await api.post('/auth/register', { name, email, password });
      }
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(errorMessage(
        requestError,
        isRegistering ? 'Unable to create account.' : 'Unable to sign in.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsRegistering((registering) => !registering);
    setError('');
  };

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1>Mini ATS</h1>
        <p>
          {isRegistering
            ? 'Create your recruiter account'
            : 'Sign in to your recruitment workspace'}
        </p>
        {error && <div className="error" role="alert">{error}</div>}
        {isRegistering && (
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={120}
              autoComplete="name"
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            required
          />
        </label>
        <button disabled={submitting}>
          {submitting
            ? 'Please wait…'
            : isRegistering
              ? 'Create account'
              : 'Sign in'}
        </button>
        <p>
          {isRegistering ? 'Already have an account?' : 'New recruiter?'}{' '}
          <button type="button" className="secondary" onClick={switchMode}>
            {isRegistering ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  );
}
