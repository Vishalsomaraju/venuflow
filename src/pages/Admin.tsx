import { Search, Filter, Plus } from 'lucide-react';

export function Admin() {
  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Staff Panel</h2>
          <p className="text-text-muted mt-1">Manage personnel, zones, and crowd simulations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-surface text-text-primary border border-surface-border rounded-md hover:bg-surface-light transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors flex items-center gap-2">
             <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-surface border border-surface-border rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center gap-4 bg-surface/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Search staff members..." className="w-full bg-primary-bg border border-surface-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted" disabled />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-xs uppercase tracking-wider text-text-muted bg-surface/30">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Assigned Zone</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-surface-border/50 hover:bg-surface-light/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-surface-light animate-pulse" />
                       <div className="w-24 h-4 rounded bg-surface-light animate-pulse" />
                    </div>
                  </td>
                  <td className="p-4"><div className="w-16 h-4 rounded bg-surface-light animate-pulse" /></td>
                  <td className="p-4"><div className="w-20 h-4 rounded bg-surface-light animate-pulse" /></td>
                  <td className="p-4"><div className="w-12 h-5 rounded-full bg-surface-light animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-surface-border">
          <h3 className="text-xl font-bold text-text-primary mb-2">Simulation Controls</h3>
          <p className="text-sm text-text-muted mb-6 max-w-2xl">Inject simulated data into Firestore to test real-time systems. This writes fake density updates every 5 seconds to demonstrate the real-time reactivity of the application during judging.</p>
          <button className="px-6 py-3 bg-accent-amber/10 border border-accent-amber/20 text-accent-amber rounded-md hover:bg-accent-amber/20 transition-colors font-medium flex items-center justify-center">
             Simulate Crowd Data (5s interval)
          </button>
      </div>
    </div>
  )
}
