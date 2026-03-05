import { useAppSelector } from '../store/store'

export function AppFooter() {

	return (
		<footer className="app-footer full">
			<p>Yoav Natan &copy; ☕ </p>
			<p>Positarget</p>

			{import.meta.env.VITE_LOCAL ?
				<span className="local-services">Local Services</span> :
				<span className="remote-services">Remote Services</span>}
		</footer>
	)
}