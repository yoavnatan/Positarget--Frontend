import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router'

import { HomePage } from './pages/HomePage'
import { AboutUs } from './pages/AboutUs'
import { MarketIndex } from './pages/MarketIndex'
import { AdminIndex } from './pages/AdminIndex'

import { MarketDetails } from './pages/MarketDetails'
import { UserDetails } from './pages/UserDetails'

import { AppHeader } from './cmps/AppHeader'
import { AppFooter } from './cmps/AppFooter'
import { LoginSignup } from './pages/LoginSignup'
import { AppMsg } from './cmps/AppMsg'
import { useAppDispatch, useAppSelector } from './store/store'
import { setIsAuthShown } from './store/slices/system.slice'


export function RootCmp() {
    const { isAuthShown } = useAppSelector((state) => state.systemModule)
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (isAuthShown) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAuthShown]);

    return (
        <div className="main-container">
            {isAuthShown && <div className="overlay" onClick={() => dispatch(setIsAuthShown(false))}></div>}
            <AppHeader />
            <AppMsg />
            {isAuthShown && <LoginSignup />}

            <main>
                <Routes>
                    <Route path="" element={<MarketIndex />} />
                    <Route path="about" element={<AboutUs />} />
                    <Route path="market/:marketId" element={<MarketDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                    <Route path="admin" element={<AdminIndex />} >
                    </Route>
                </Routes>
            </main>
            <AppFooter />
        </div >
    )
}


