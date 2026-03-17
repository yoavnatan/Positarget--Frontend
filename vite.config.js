import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr";

export default defineConfig(({ command }) => {
	return {
		// אם אנחנו ב-build (כלומר ל-GitHub Pages), השתמש בנתיב הריפו. אחרת בשורש.
		base: command === 'build' ? '/Positarget--Frontend/' : '/',

		plugins: [react(), svgr()],
		define: {
			'process.env': {}
		},
		server: {
			proxy: {
				'/api': {
					target: 'http://localhost:3030', // וודא שזה הפורט של ה-Backend הלוקלי שלך
					changeOrigin: true,
				},
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
						proxyReq.setHeader('Origin', 'https://polymarket.com');
						proxyReq.setHeader('Referer', 'https://polymarket.com/');
					},
				},
				'/poly-comments': {
					target: 'https://gamma-api.polymarket.com',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/poly-comments/, '/comments')
				},
				'/poly-gamma': {
					target: 'https://gamma-api.polymarket.com',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/poly-gamma/, ''),
				},
			}
		}
	}
})