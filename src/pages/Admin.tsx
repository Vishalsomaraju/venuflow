import { useState } from 'react'
import { seedDatabase } from '@/lib/seedData'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { SimulationControl } from '@/components/dashboard/SimulationControl'
import toast from 'react-hot-toast'
import { Database, ShieldAlert, Cpu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Navigate } from 'react-router-dom'


export function Admin() {
  // Allow both staff and admin — staff mode gives access to all tools
  const isStaff = useAuthStore((s) => s.isStaff())
  const [isSeeding, setIsSeeding] = useState(false)

  if (!isStaff) {
    return <Navigate to="/" replace />
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    const seedToast = toast.loading('Seeding database...')
    try {
      await seedDatabase()
      toast.success('Database seeded successfully!', { id: seedToast })
    } catch (error) {
      console.error(error)
      toast.error('Failed to seed database.', { id: seedToast })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Admin Control Panel
        </h1>
        <p className="text-text-secondary mt-1">
          System configuration and simulator controls
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seeding Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-accent/10">
                <Database className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Data Seeding
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Initialize the database with 12 stadium zones and 22 facilities.
              This will overwrite existing data.
            </p>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full sm:w-auto px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 disabled:opacity-50 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              {isSeeding ? 'Seeding...' : 'Seed Database'}
            </button>
          </CardContent>
        </Card>

        {/* Simulator Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Cpu className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Live Simulator
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Start the background engine to simulate live crowd movement and
              facility wait times. Updates every 5 seconds.
            </p>
            <SimulationControl />
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="ring-1 ring-red-500/30 bg-red-500/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-400">
              Danger Zone
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary mb-4">
            Actions here can cause irreversible data loss. Ensure you are not
            running a live demo before proceeding.
          </p>
          <button className="px-4 py-2.5 ring-1 ring-red-500/50 text-red-400 rounded-xl font-medium hover:bg-red-500/10 transition-colors active:scale-[0.98]">
            Wipe Firestore Data
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
