export default function Button({ children, variant = 'primary', style, ...props }) {
  const base = {
    padding: '8px 16px',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    border: '1px solid transparent',
    transition: 'opacity 0.15s',
  };

  const variants = {
    primary: { background: 'var(--color-primary)', color: '#fff' },
    secondary: { background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-border)' },
    danger: { background: 'transparent', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' },
    success: { background: 'var(--color-success)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--color-text-muted)' },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
