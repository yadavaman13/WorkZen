import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthProvider'

export default function PayrollDashboard(){
  const { user, logout } = useAuth()
  const [completion, setCompletion] = useState(0)

  useEffect(()=>{
    api.get('/api/user/profile-completion').then(r=>setCompletion(r.data.completion)).catch(()=>{})
  },[])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold" style={{color:'#A24689'}}>Payroll Dashboard</h1>
        <p className="mt-2">Welcome, {user?.name} ({user?.role})</p>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded h-4">
            <div className="h-4 rounded" style={{width: `${completion}%`, backgroundColor: '#A24689'}} />
          </div>
          <p className="text-sm mt-2">Profile completion: {completion}%</p>
        </div>

        <div className="mt-6 space-x-2">
          <button onClick={logout} className="px-4 py-2 rounded border">Logout</button>
        </div>
      </div>
    </div>
  )
}
