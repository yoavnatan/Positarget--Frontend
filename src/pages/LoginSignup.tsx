import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../cmps/LoginForm.js'
import { useState } from 'react'
import { useAppDispatch } from '../store/store.js'
import { login, signup } from '../store/slices/user.slice.js'
import { setIsAuthShown, setMsg } from '../store/slices/system.slice.js'
import { UserCred } from '../types/user.type.js'

export function LoginSignup() {
    const dispatch = useAppDispatch()

    const [isSignup, setIsSignUp] = useState(false)
    const navigate = useNavigate()

    function onLogin(credentials: UserCred) {
        isSignup ? _signup(credentials) : _login(credentials)
    }

    async function _login(credentials: UserCred) {
        try {
            await dispatch(login(credentials)).unwrap()
            dispatch(setIsAuthShown(false))
            dispatch(setMsg({ txt: 'Logged in successfully', type: 'success' }))
            navigate('/')
        } catch (err) {

            dispatch(setMsg({ txt: 'Failed to login', type: 'error' }))

        }
    }

    function _signup(credentials: UserCred) {
        dispatch(signup(credentials))

            .then(() => {
                dispatch(setMsg({ txt: 'Signed in successfully', type: 'success' }))
                navigate('/')

            })
            .catch((err) => {

                dispatch(setMsg({ txt: 'Failed to sign-up', type: 'error' }))
            })
    }

    return (
        <>
            <div className="login-page">
                <LoginForm
                    onLogin={onLogin}
                    isSignup={isSignup}
                />
                <div className="btns">
                    <a href="#" onClick={() => setIsSignUp(!isSignup)}>
                        {isSignup ?
                            'Already a member? Login' :
                            'New user? Signup here'
                        }
                    </a >
                </div>
            </div >
        </>
    )
}
