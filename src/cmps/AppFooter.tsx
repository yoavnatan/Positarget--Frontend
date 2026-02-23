import { useAppSelector } from '../store/store'

export function AppFooter() {
	const count = useAppSelector(state => state.userModule.count)

	return (
		<footer className="app-footer full">
			<p>Coffeerights &copy; ☕ </p>
			<p>Count: {count}</p>

			{import.meta.env.VITE_LOCAL ?
				<span className="local-services">Local Services</span> :
				<span className="remote-services">Remote Services</span>}
		</footer>
	)
}