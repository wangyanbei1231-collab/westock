import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 这行代码让你的代码中可以使用 process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    // 这是为了 GitHub Pages 部署，仓库名如果是 westock，这里就是 /westock/
    base: './', 
  }
})