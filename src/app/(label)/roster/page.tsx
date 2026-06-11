import { Radio, Plus, Users, TrendingUp } from 'lucide-react'

export default function RosterPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Label Roster</h1>
          </div>
          <p className="text-sm text-zinc-400">Your entire roster. One dashboard.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />
          Invite Artist
        </button>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Artists', value: '0', icon: Users },
          { label: 'Total Fans', value: '0', icon: Users },
          { label: 'Total Link Clicks', value: '0', icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{label}</span>
              <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
          <Radio className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No artists on your roster yet</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">
          Invite your signed artists to give them a free FlyLink account and manage them from here.
        </p>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />
          Invite First Artist
        </button>
      </div>
    </div>
  )
}
