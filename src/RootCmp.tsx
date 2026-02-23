import React from 'react'
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


export function RootCmp() {
    return (
        <div className="main-container">
            <AppHeader />
            <AppMsg />

            <main>
                <Routes>
                    <Route path="" element={<HomePage />} />
                    <Route path="about" element={<AboutUs />} />
                    <Route path="market" element={<MarketIndex />} />
                    <Route path="market/:marketId" element={<MarketDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                    <Route path="admin" element={<AdminIndex />} />
                    <Route path="auth" element={<LoginSignup />}>
                    </Route>
                </Routes>
            </main>
            <AppFooter />
        </div>
    )
}


