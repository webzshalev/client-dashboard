import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'https://api.truecontrol.co.il',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
