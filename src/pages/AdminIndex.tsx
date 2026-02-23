import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../store/store'
import { loadUsers, removeUser } from '../store/slices/user.slice'

export function AdminIndex() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { user, users, isLoading } = useAppSelector(state => state.userModule)

    useEffect(() => {
        if (user && !user.isAdmin) navigate('/')
        dispatch(loadUsers())
    }, [])

    return <section className="admin">
        {isLoading && 'Loading...'}
        {users && (
            <ul>
                {users.map(user => (
                    <li key={user._id}>
                        <pre>{JSON.stringify(user, null, 2)}</pre>
                        <button onClick={() => dispatch(removeUser(user._id))}>
                            Remove {user.username}
                        </button>
                    </li>
                ))}
            </ul>
        )}
    </section>
}
