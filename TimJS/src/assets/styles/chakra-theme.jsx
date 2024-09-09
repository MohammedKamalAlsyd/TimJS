import { extendTheme } from '@chakra-ui/react';
import { color } from 'framer-motion';

const customTheme = extendTheme({
  styles: {
    global: (props) => ({
      body: {
        backgroundColor: props.colorMode === 'dark' ? '#000000' : '#FFFFFF',
        color: props.colorMode === 'dark' ? '#FFFFFF' : '#000000',
      },
    }),
  },
  fonts: {
    heading: "'Roboto', Inter, sans-serif",
    body: "'Roboto', Inter, sans-serif",
  },
});

export default customTheme;
