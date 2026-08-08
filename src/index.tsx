import { MantineProvider, createTheme, rem } from '@mantine/core';
import ReactDOM from 'react-dom/client';

import '@mantine/core/styles.css';
import App from './App.tsx';
import './index.css';

const theme = createTheme({
  components: {
    Menu: {
      styles: {
        item: {
          padding: `${rem(10)} ${rem(16)}`, // Increases vertical and horizontal spacing
          fontSize: rem(16),               // Increases text size
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <MantineProvider theme={theme}>
    <App />
  </MantineProvider>
);
