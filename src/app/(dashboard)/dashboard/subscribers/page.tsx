import { Users, Download } from 'lucide-react'

export default function SubscribersPage() {
  const stats = [
    { label: 'Total Subscribers', value: '0' },
    { label: 'New This Week', value: '0' },
    { label: 'New This Month', value: '0' },
    { label: 'Sources', value: '0' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscribers</h1>
          <p className="text-sm text-zinc-400 mt-1">Fan emails collected from links, pre-saves, and gates</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">
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

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 mb-6">
        {['Subscribers', 'Broadcasts'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'Subscribers'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-6">
        {['All', 'Pre-Save', 'Email Capture', 'Imported'].map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              f === 'All'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-10 h-10 text-zinc-700 mb-4" />
        <p className="text-zinc-400 text-sm">No subscribers yet.</p>
        <p className="text-zinc-600 text-xs mt-1">Enable email capture on your FlyLinks to start collecting fans.</p>
      </div>
    </div>
  )
}
