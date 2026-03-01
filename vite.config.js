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
			// כל בקשה שתתחיל ב- /poly-api תופנה לפולימרקט
			'/poly-api': {
				target: 'https://gamma-api.polymarket.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/poly-api/, ''),
			},
		},
	},
})
