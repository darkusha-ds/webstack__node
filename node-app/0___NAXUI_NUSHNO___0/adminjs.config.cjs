 
import AdminJS from 'adminjs';

module.exports = {
  bundler: {
    vite: {
      config: {
        root: process.cwd(),
        optimizeDeps: {
          include: ['react', 'react-dom', '@adminjs/design-system'],
        },
      },
      server: {
        port: 4888,
      },
    },
  },
}