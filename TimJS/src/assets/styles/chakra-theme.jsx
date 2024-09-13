import { extendTheme } from '@chakra-ui/react';

const customTheme = extendTheme({
  styles: {
    global: (props) => ({
      html: {
        height: '100%',  // Ensure html takes full height
      },
      body: {
        height: '100%',  // Ensure body takes full height
        backgroundColor: props.colorMode === 'dark' ? '#000000' : '#FFFFFF',
        color: props.colorMode === 'dark' ? '#FFFFFF' : '#000000',
        margin: 0,
        padding: 0,
      },
      '#root': {
        height: '100%',  // If using React, ensure the root div takes full height
      },
    }),
  },
  fonts: {
    heading: "'Roboto', Inter, sans-serif",
    body: "'Roboto', Inter, sans-serif",
  },
});

export default customTheme;
