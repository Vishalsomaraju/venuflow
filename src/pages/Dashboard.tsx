import { BarChart3, Users, Clock, AlertTriangle } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-text-secondary">Welcome to VenueFlow</h1>
        <p className="text-text-muted mt-2">Real-time stadium analytics and crowd monitoring.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {[
          { label: 'Total Attendance', value: '--', icon: Users, color: 'text-accent' },
          { label: 'Avg Wait Time', value: '-- min', icon: Clock, color: 'text-accent-amber' },
          { label: 'Congested Zones', value: '--', icon: AlertTriangle, color: 'text-accent-red' },
          { label: 'Overall Flow', value: '--%', icon: BarChart3, color: 'text-accent-green' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface p-6 rounded-xl border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 text-text-primary">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full bg-surface-light flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-surface-border p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-text-muted">Live Density Chart Area</p>
      </div>
    </div>
  )
}
