export default function ArtistPageEditor() {
  return (
    <div className="flex h-full">
      {/* Editor panel */}
      <div className="w-[380px] border-r border-zinc-800 overflow-y-auto bg-zinc-900/50">
        <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
            Save
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">
            View Live
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Section order */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Section Order</span>
              <span className="text-xs text-zinc-500">Drag to reorder</span>
            </div>
            <div className="border-t border-zinc-800 divide-y divide-zinc-800">
              {['Bio', 'FlyLinks', 'Pre-Save', 'Custom Links', 'Email Capture'].map((s) => (
                <div key={s} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 cursor-grab">⠿</span>
                    <span className="text-sm text-zinc-300">{s}</span>
                  </div>
                  <button className="w-8 h-5 bg-yellow-400 rounded-full flex items-center justify-end pr-0.5 transition-colors">
                    <span className="w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3">
              <span className="text-sm font-medium text-white">Theme</span>
            </div>
            <div className="border-t border-zinc-800 p-3 grid grid-cols-2 gap-2">
              {[
                { name: 'Minimal', colors: ['#3f3f46', '#52525b', '#71717a'] },
                { name: 'Bold', colors: ['#f59e0b', '#f97316', '#eab308'] },
                { name: 'Elegant', colors: ['#8b5cf6', '#7c3aed', '#6d28d9'] },
                { name: 'Neon', colors: ['#22c55e', '#16a34a', '#15803d'] },
              ].map(({ name, colors }) => (
                <button
                  key={name}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    name === 'Minimal'
                      ? 'border-yellow-400 bg-zinc-800'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    {colors.map((c) => (
                      <div key={c} className="w-4 h-4 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-zinc-300">{name}</span>
                  <p className="text-xs text-zinc-500">Aa Bb Cc</p>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible settings */}
          {['Artist Name', 'Bio', 'Typography', 'Cover Image', 'Profile Photo', 'Background', 'Social Links', 'Custom Links', 'Email Capture'].map((section) => (
            <div key={section} className="bg-zinc-900 border border-zinc-800 rounded-xl">
              <button className="w-full flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-white">{section}</span>
                <span className="text-zinc-500 text-xs">›</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-start p-8 overflow-y-auto">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-6 font-medium">Live Preview</p>
        <div className="w-[390px] min-h-[844px] bg-zinc-900 rounded-[40px] border border-zinc-700 overflow-hidden shadow-2xl flex flex-col items-center pt-16 pb-8 px-6">
          <div className="w-24 h-24 rounded-full bg-zinc-700 mb-4 border-2 border-zinc-600" />
          <p className="text-xl font-bold text-white mb-1">Your Artist Name</p>
          <p className="text-sm text-zinc-500 mb-6 text-center">Add a bio to tell visitors about yourself</p>
          <p className="text-sm text-zinc-600">No releases yet</p>
        </div>
      </div>
    </div>
  )
}
