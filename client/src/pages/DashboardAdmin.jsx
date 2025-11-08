import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthProvider'

export default function AdminDashboard(){
  const { user, logout } = useAuth()
  const [escalations, setEscalations] = useState([])

  useEffect(()=>{
    api.get('/api/admin/roles/escalations').then(r=>setEscalations(r.data.rows)).catch(()=>{})
  },[])

  const review = async (id, status)=>{
    await api.post('/api/admin/roles/review', { id, status })
    setEscalations(escalations.map(e=> e.id===id ? { ...e, status } : e))
  }

  const impersonate = async ()=>{
    const id = prompt('Enter user id to impersonate')
    if(!id) return
    const res = await api.post('/api/admin/impersonate', { target_user_id: Number(id) })
    // store impersonation token temporarily
    localStorage.setItem('token', res.data.token)
    alert('Now impersonating - reload will use impersonated token')
    window.location.reload()
  }

  const suspendUser = async ()=>{
    const id = prompt('Enter user id to suspend')
    const reason = prompt('Reason')
    if(!id) return
    await api.post('/api/admin/suspend', { userId: Number(id), reason })
    alert('User suspended')
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold" style={{color:'#A24689'}}>Admin Dashboard</h1>
        <p className="mt-2">Welcome, {user?.name} ({user?.role})</p>

        <div className="mt-4">
          <h2 className="text-xl font-semibold">Pending Escalations</h2>
          <ul className="mt-2 space-y-2">
            {escalations.map(e=> (
              <li key={e.id} className="p-3 border rounded">
                <div><strong>#{e.id}</strong> requester: {e.requester_id} requested: {e.requested_role}</div>
                <div className="text-sm">reason: {e.reason}</div>
                <div className="mt-2 space-x-2">
                  <button onClick={()=>review(e.id,'approved')} className="px-3 py-1 rounded brand-btn">Approve</button>
                  <button onClick={()=>review(e.id,'rejected')} className="px-3 py-1 rounded border">Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-x-2">
          <button onClick={impersonate} className="px-4 py-2 rounded brand-btn">Impersonate User</button>
          <button onClick={suspendUser} className="px-4 py-2 rounded border">Suspend User</button>
          <button onClick={logout} className="px-4 py-2 rounded">Logout</button>
        </div>
      </div>
    </div>
  )
}
