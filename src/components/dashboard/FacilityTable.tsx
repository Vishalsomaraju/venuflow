// src/components/dashboard/FacilityTable.tsx
import { useVenueStore } from '@/store/venueStore'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatWaitTime } from '@/lib/utils'
import {
  DoorOpen,
  UtensilsCrossed,
  Bath,
  ShoppingBag,
  Cross,
  Info,
} from 'lucide-react'
import type { FacilityType } from '@/types'

const facilityIcons: Record<FacilityType, React.ElementType> = {
  gate: DoorOpen,
  concession: UtensilsCrossed,
  restroom: Bath,
  merchandise: ShoppingBag,
  medical: Cross,
  info: Info,
}

function getWaitVariant(
  minutes: number
): 'success' | 'warning' | 'danger' {
  if (minutes <= 5) return 'success'
  if (minutes <= 15) return 'warning'
  return 'danger'
}

export function FacilityTable() {
  const facilities = useVenueStore((s) => s.facilities)
  const zones = useVenueStore((s) => s.zones)

  const getZoneName = (zoneId: string) =>
    zones.find((z) => z.id === zoneId)?.name ?? zoneId

  const sorted = [...facilities].sort(
    (a, b) => b.waitMinutes - a.waitMinutes
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">
            Facility Wait Times
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">
            No facility data available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-2 px-2 text-text-secondary font-medium">
                    Facility
                  </th>
                  <th className="text-left py-2 px-2 text-text-secondary font-medium">
                    Zone
                  </th>
                  <th className="text-left py-2 px-2 text-text-secondary font-medium">
                    Wait
                  </th>
                  <th className="text-left py-2 px-2 text-text-secondary font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((facility) => {
                  const Icon =
                    facilityIcons[facility.type as FacilityType] || Info

                  return (
                    <tr
                      key={facility.id}
                      className="border-b border-surface-border/50 hover:bg-surface-light/30 transition-colors"
                    >
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-text-muted" />
                          <span className="text-text-primary">
                            {facility.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-text-secondary">
                        {getZoneName(facility.zoneId)}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant={getWaitVariant(facility.waitMinutes)}
                        >
                          {formatWaitTime(facility.waitMinutes)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant={facility.isOpen ? 'success' : 'danger'}
                        >
                          {facility.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
