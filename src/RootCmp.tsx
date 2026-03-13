import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router'

import { HomePage } from './pages/HomePage'
import { AboutUs } from './pages/AboutUs'
import { EventIndex } from './pages/EventIndex'
import { AdminIndex } from './pages/AdminIndex'

import { EventDetails } from './pages/EventDetails'
import { UserDetails } from './pages/UserDetails'

import { AppHeader } from './cmps/AppHeader'
import { AppFooter } from './cmps/AppFooter'
import { LoginSignup } from './pages/LoginSignup'
import { AppMsg } from './cmps/AppMsg'
import { useAppDispatch, useAppSelector } from './store/store'
import { setIsAuthShown, setModalType } from './store/slices/system.slice'
import { Modal } from './cmps/Modal'

import { motion, AnimatePresence } from 'framer-motion'
import { Search } from './pages/Search'
import { DepositModal } from './cmps/DepositModal'

export function RootCmp() {
    const { isAuthShown, modalType } = useAppSelector((state) => state.systemModule)
    const dispatch = useAppDispatch()

    const closeAll = () => {
        dispatch(setModalType(null))
    }

    return (
        <div className="main-container">
            <AnimatePresence>
                {/* ניהול ה-Overlay תחת AnimatePresence */}
                {modalType && (
                    <motion.div
                        key="app-overlay"
                        className="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={closeAll}
                    />
                )}

                {modalType === 'AUTH' && (
                    <Modal>
                        <LoginSignup />
                    </Modal>
                )}



                {modalType === 'DEPOSIT' && <DepositModal />}
            </AnimatePresence>

            <AppHeader />
            <AppMsg />

            <main>
                <Routes>
                    <Route path="/" element={<EventIndex />} />
                    <Route path="/:categorie" element={<EventIndex />} />
                    <Route path="search" element={<Search />} />
                    <Route path="about" element={<AboutUs />} />
                    <Route path="event/:eventId" element={<EventDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                    <Route path="admin" element={<AdminIndex />} />
                </Routes>
            </main>
            <AppFooter />
        </div>
    )
}