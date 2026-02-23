import { userService } from "../services/user"
import { useAppDispatch } from "../store/store.js"
import { useForm } from "../customHooks/useForm"

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

    return (
        <form className="login-form" onSubmit={handleSubmit}>
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
            <button>{isSignup ? 'Signup' : 'Login'}</button>
        </form>
    )
}