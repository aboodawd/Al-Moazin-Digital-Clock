import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error || 'Unknown error');
    return { hasError: true, errorMessage: msg };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#060B08',
            color: '#E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          <h2 style={{ color: '#F59E0B', marginBottom: '12px' }}>
            حدث خطأ غير متوقع أثناء تشغيل ساعة المؤذن
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '500px', marginBottom: '20px' }}>
            {this.state.errorMessage}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#0D9488',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              إعادة تحميل الصفحة
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.removeItem('almoazin_world_state_v4');
                  window.localStorage.removeItem('almoazin_world_state_v4_backup');
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              style={{
                background: '#1E293B',
                color: '#FBBF24',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              إعادة ضبط الإعدادات الافتراضية
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function mountApp() {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  try {
    createRoot(rootEl).render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    );
    (window as unknown as { __ALMOAZIN_MOUNTED__?: boolean }).__ALMOAZIN_MOUNTED__ = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err || 'Render error');
    rootEl.textContent = `حدث خطأ أثناء تشغيل الساعة: ${msg}`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp, { once: true });
} else {
  mountApp();
}
