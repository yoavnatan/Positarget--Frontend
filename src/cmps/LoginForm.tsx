import { userService } from "../services/user"
import { useAppDispatch } from "../store/store.js"
import { useForm } from "../customHooks/useForm"
import { UserCred } from "../types/user.type";

interface LoginFormProps {
    onLogin: (credentials: { username?: string; password: string; email?: string }) => void;
    isSignup: boolean;
}

export function LoginForm({ onLogin, isSignup }: LoginFormProps) {
    const [credentials, handleChange] = useForm(userService.getEmptyCredentials())

    function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault()
        onLogin(credentials)
    }

    async function onGuestMode(ev: React.MouseEvent) {
        if (ev) {
            ev.preventDefault()
            ev.stopPropagation()
        }

        try {
            const guestCredentials = await userService.getGuestCredentials()
            await onLogin(guestCredentials as UserCred)
        } catch (err) {
            console.error('Failed guest login:', err)
        }
    }

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <h1>Welcome</h1>
            <input
                type="text"
                name="username"
                value={credentials.username}
                placeholder="Username"
                onChange={handleChange}
                required
                autoFocus
            />
            <input
                type="password"
                name="password"
                value={credentials.password}
                placeholder="Password"
                onChange={handleChange}
                required
                autoComplete="off"
            />
            {isSignup && <input
                type="text"
                name="email"
                value={credentials.email}
                placeholder="Full name"
                onChange={handleChange}
                required
            />}
            <button type="submit" className="signup-link">{isSignup ? 'Signup' : 'Login'}</button>
            <button type="button" className="signup-link guest" onClick={onGuestMode}>I'm a Guest</button>
        </form>
    )
}