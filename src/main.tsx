import { createRoot } from 'react-dom/client';
import { Providers } from './Providers';
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

createRoot(document.getElementById('root')!).render(
  <Providers>
    <App />
  </Providers>
);
