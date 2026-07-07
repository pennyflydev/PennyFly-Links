'use client'

import { useEffect, useState } from 'react'
import { Users, Mail, Loader2 } from 'lucide-react'

type Member = { id: string; member_role: string; profiles: { email: string } | null }
type Invite = { id: string; email: string; member_role: string }

export default function LabelTeam() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('manager')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/label/members')
      .then((r) => r.json())
      .then((d) => { setMembers(d.members ?? []); setInvites(d.invites ?? []) })
      .finally(() => setLoading(false))
  }, [])

  async function invite() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/label/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (res.ok) { setInvites((p) => [data.invite, ...p]); setEmail(''); setOpen(false) }
      else setError(data.error ?? 'Could not invite')
    } catch { setError('Could not invite') }
    setBusy(false)
  }

  const count = members.length + invites.length

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-zinc-400" /> Team</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Invite managers to help run your roster.</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">
          + Add member
        </button>
      </div>

      {open && (
        <div className="mt-4 flex items-center gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@email.com"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500">
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={invite} disabled={busy || !email}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}Invite
          </button>
        </div>
      )}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm mt-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : count === 0 ? (
        <p className="text-sm text-zinc-500 mt-4">No team members yet — invite someone above.</p>
      ) : (
        <div className="mt-4 border-t border-zinc-800 pt-4 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">{m.profiles?.email}</span>
              <span className="text-xs text-zinc-500 capitalize">{m.member_role}</span>
            </div>
          ))}
          {invites.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-zinc-400"><Mail className="w-3.5 h-3.5 text-zinc-600" />{i.email}</span>
              <span className="text-xs text-zinc-600 capitalize">{i.member_role} · pending</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
