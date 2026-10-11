import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { DemoGate } from './components/DemoGate.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DemoGate>
        <App />
      </DemoGate>
    </ErrorBoundary>
  </StrictMode>,
);
