import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), svgr()],
	// After setting-up a backend, this can automoate the copying process of the built files:
	// build: {
	// 	outDir: '../backend/public',
	// 	emptyOutDir: true,
	// },
	// If we want to build a local version (that uses local services)
	// define: {
	// 	'process.env.VITE_LOCAL': 'true'
	// }
	server: {
		proxy: {
			'/poly-search': {
				target: 'https://gamma-api.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-search/, '/public-search'),
				configure: (proxy, _options) => {
					proxy.on('error', (err, _req, _res) => {
						console.log('proxy error', err);
					});
				},
			},
			'/poly-api': {
				target: 'https://gamma-api.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-api/, '')
			},
			'/poly-clob': {
				target: 'https://clob.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-clob/, ''),
			},
			'/poly-comments': {
				target: 'https://gamma-api.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-comments/, '/comments')
			},
		}
	}
})
