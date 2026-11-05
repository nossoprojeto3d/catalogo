import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { Painel } from './Painel';
import '../styles.css';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <Painel />
    <Toaster position="top-center" />
  </StrictMode>,
);
