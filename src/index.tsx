import { MantineProvider } from '@mantine/core';
import ReactDOM from 'react-dom/client';

import '@mantine/core/styles.css';
import App from './App.tsx';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <MantineProvider>
    <App />
  </MantineProvider>
);
