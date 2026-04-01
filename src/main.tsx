import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import SuccessPage from './components/SuccessPage.tsx';
import PricingPage from './components/PricingPage.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

const path = window.location.pathname;

let component;
if (path === '/success') {
  component = <SuccessPage />;
} else if (path === '/pricing') {
  component = <PricingPage />;
} else {
  component = <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {component}
  </StrictMode>
);
