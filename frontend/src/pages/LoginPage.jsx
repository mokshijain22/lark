import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { inputStyle } from '../shared/components/Field';
import Button from '../shared/components/Button';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/contacts');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ width: 380, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Nook</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 24 }}>
          {mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace account'}
        </p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <input
              style={{ ...inputStyle, marginBottom: 12 }}
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            style={{ ...inputStyle, marginBottom: 12 }}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={{ ...inputStyle, marginBottom: 16 }}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <Button type="submit" style={{ width: '100%' }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={() => setMode('register')} style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => setMode('login')} style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  );
}
