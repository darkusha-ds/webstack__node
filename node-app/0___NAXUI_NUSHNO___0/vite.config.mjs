console.log('🚀 vite.config.mjs ЗАГРУЖЕН');
import path from 'path'

export default {
  root: '.',
  optimizeDeps: {
    include: ['react', 'react-dom', '@adminjs/design-system'],
    exclude: ['@emotion/react'], // ← добавь эту строку
  },
  resolve: {
    alias: {
      'components/FontTools': path.resolve('./components/FontTools.jsx'),
      '@emotion/react': path.resolve('./node_modules/@emotion/react'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        'components/FontTools': path.resolve('./components/FontTools.jsx')
      }
    }
  }
}