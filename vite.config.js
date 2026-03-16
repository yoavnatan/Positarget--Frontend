import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr";

export default defineConfig({
	base: '/Positarget--Frontend/',
	plugins: [react(), svgr()],
	server: {
		proxy: {
			'/poly-search': {
				target: 'https://gamma-api.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-search/, '/public-search'),
			},
			'/poly-api': {
				target: 'https://gamma-api.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-api/, '')
			},
			'/poly-clob': {
				target: 'https://clob.polymarket.com',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/poly-clob/, ''),
				onProxyReq: (proxyReq) => {
					// דריסת Headers שגורמים ל-403
					proxyReq.setHeader('Origin', 'https://polymarket.com');
					proxyReq.setHeader('Referer', 'https://polymarket.com/');
					proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
				},
			},
			'/poly-comments': {
				target: 'https://gamma-api.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-comments/, '/comments')
			},
		}
	}
})