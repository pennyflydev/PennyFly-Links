'use client'

import { useState } from 'react'
import { Users, Download } from 'lucide-react'

export type Subscriber = {
  id: string
  email: string
  name: string | null
  source: string
  country: string | null
  created_at: string
}

const SOURCE_LABELS: Record<string, string> = {
  presave: 'Pre-Save',
  email_capture: 'Email Capture',
  imported: 'Imported',
}

const FILTERS = ['All', 'Pre-Save', 'Email Capture', 'Imported'] as const
const FILTER_TO_SOURCE: Record<string, string | null> = {
  All: null,
  'Pre-Save': 'presave',
  'Email Capture': 'email_capture',
  Imported: 'imported',
}

export default function SubscribersClient({
  subscribers,
  stats,
}: {
  subscribers: Subscriber[]
  stats: { label: string; value: number }[]
}) {
  const [filter, setFilter] = useState<string>('All')

  const source = FILTER_TO_SOURCE[filter]
  const rows = source ? subscribers.filter((s) => s.source === source) : subscribers

  function exportCsv() {
    const header = ['Email', 'Name', 'Source', 'Country', 'Date Added']
    const lines = rows.map((s) =>
      [
        s.email,
        s.name ?? '',
        SOURCE_LABELS[s.source] ?? s.source,
        s.country ?? '',
        new Date(s.created_at).toISOString().split('T')[0],
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscribers</h1>
          <p className="text-sm text-zinc-400 mt-1">Fan emails collected from links, pre-saves, and gates</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-zinc-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              f === filter ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-10 h-10 text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-sm">No subscribers yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Pre-save campaigns and email capture will populate this list.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 text-left">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((s) => (
                <tr key={s.id} className="text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-white">{s.email}</td>
                  <td className="px-5 py-3 text-zinc-400">{s.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                      {SOURCE_LABELS[s.source] ?? s.source}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
