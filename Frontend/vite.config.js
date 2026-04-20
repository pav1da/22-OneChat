import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/onechat/',
    server: {
        host: true, // อนุญาตให้เข้าถึงผ่าน IP ของเครื่องในวง LAN เดียวกัน
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                ws: true,
            },
            '/uploads': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    }
})
