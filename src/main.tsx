import { createRoot } from 'react-dom/client';
import { Providers } from './Providers';
import App from './App';

import '@mantine/core/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import '@xyflow/react/dist/style.css';

createRoot(document.getElementById('root')!).render(
  <Providers>
    <App />
  </Providers>
);