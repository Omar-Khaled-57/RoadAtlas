import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import { ThemeProvider } from './theme/ThemeProvider';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry transient failures (network errors / 5xx) twice with exponential
      // backoff; never retry client errors (4xx) — replaying them only delays
      // the error state the user needs to see.
      retry: (failureCount, error) => {
        if (isAxiosError(error) && error.response && error.response.status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8_000),
      staleTime: 30_000,
    },
    // Writes are not idempotent; retrying them automatically could duplicate records.
    mutations: { retry: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
