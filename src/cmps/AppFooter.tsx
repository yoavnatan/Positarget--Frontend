import { useAppSelector } from '../store/store'
import Search from '../assets/svg/search.svg?react'
import Home from '../assets/svg/home.svg?react'
import Breaking from '../assets/svg/breaking.svg?react'
import Current from '../assets/svg/current.svg?react'
import { NavLink } from 'react-router-dom'

export function AppFooter() {

	const { user } = useAppSelector((state) => state.userModule)
	function getPorfolioSum() {
		if (!user?.portfolio) return 0
		const positionsSum = user.portfolio.reduce((acc, position) => {
			const positionValue = position.shares * position.avgPrice / 100
			return acc + positionValue
		}, 0)
		return positionsSum + (user.cash || 0)
	}

	return (
		<footer className="app-footer full">
			<NavLink to="/" className="icon-wrapper">
				<Home className="icon" />
				<h4>Home</h4>
			</NavLink>
			<NavLink to="/search" className="icon-wrapper">
				<Search className="icon" />
				<h4>Search</h4>

			</NavLink>
			<div className="icon-wrapper">
				<Breaking className="icon" />
				<h4>Breaking</h4>

			</div>
			<NavLink to="/portfolio" className="icon-wrapper">
				<Current className="icon" />
				<h4>${getPorfolioSum().toFixed(2) || '0.00'}</h4>

			</NavLink>
		</footer>
	)
}