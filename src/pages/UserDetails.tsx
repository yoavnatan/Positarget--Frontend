import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { loadUser } from '../store/slices/user.slice'
import { useAppDispatch, useAppSelector } from '../store/store'

export function UserDetails() {
  const dispatch = useAppDispatch()
  const params = useParams()
  const { user } = useAppSelector(state => state.userModule)

  useEffect(() => {
    if (params.id) dispatch(loadUser(params.id));
  }, [params.id])


  return (
    <section className="user-details">
      <h1>User Details</h1>
      {user && <div>
        <h3>
          {user.username}
        </h3>
        <img src={user.imgUrl} style={{ width: '100px' }} />
        <pre> {JSON.stringify(user, null, 2)} </pre>
      </div>}
    </section>
  )
}