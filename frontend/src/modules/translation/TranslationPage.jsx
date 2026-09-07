import { useState } from 'react';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/context/AuthContext';
import Button from '../../shared/components/Button';
import Field, { inputStyle } from '../../shared/components/Field';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
];

export default function TranslationPage() {
  const { user, updateUser } = useAuth();
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [savingPref, setSavingPref] = useState(false);

  const [sourceText, setSourceText] = useState('');
  const [targetLang, setTargetLang] = useState('hi');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const savePreference = async (lang) => {
    setPreferredLanguage(lang);
    setSavingPref(true);
    try {
      await client.patch('/translation/preference', { preferredLanguage: lang });
      if (updateUser) updateUser({ preferredLanguage: lang });
    } finally {
      setSavingPref(false);
    }
  };

  const runTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    setError('');
    setTranslated('');
    try {
      const res = await client.post('/translation/translate', { text: sourceText, targetLang });
      setTranslated(res.data.data.translated);
    } catch (err) {
      setError(err?.response?.data?.message || 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Auto-translation</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Set your preferred language and try translating a message. Once wired into chat, messages will
        show a "Translate" toggle that uses this same preference.
      </p>

      <div style={{ maxWidth: 480, marginBottom: 32 }}>
        <Field label="Your preferred language">
          <select
            style={inputStyle}
            value={preferredLanguage}
            disabled={savingPref}
            onChange={(e) => savePreference(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </Field>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Incoming messages will be offered to you translated into this language.
        </div>
      </div>

      <div style={{ maxWidth: 480, border: '1px solid var(--color-border)', borderRadius: 10, padding: 20, background: 'var(--color-surface)' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Try it</div>

        <Field label="Text">
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Type a message to translate..."
          />
        </Field>

        <Field label="Translate to">
          <select style={inputStyle} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </Field>

        <Button variant="primary" onClick={runTranslate} disabled={loading || !sourceText.trim()}>
          {loading ? 'Translating...' : 'Translate'}
        </Button>

        {error && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-danger)' }}>{error}</div>
        )}

        {translated && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Translated</div>
            <div style={{ fontSize: 14 }}>{translated}</div>
          </div>
        )}
      </div>
    </div>
  );
}