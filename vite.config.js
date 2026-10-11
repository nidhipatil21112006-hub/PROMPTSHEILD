import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      ignored: [
        '**/*.json',
        '**/*.jsonl',
        '**/*.log',
        '**/logs/**',
        '**/audit/**',
        '**/data/**',
        '**/evals/**',
        '**/__pycache__/**',
        '**/.venv/**',
      ],
    },
  },
})