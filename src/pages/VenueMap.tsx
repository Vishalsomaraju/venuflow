import { Map as MapIcon } from 'lucide-react';

export function VenueMap() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] pb-16 md:pb-0 md:h-screen w-full relative overflow-hidden">
      {/* Map Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-10 bg-gradient-to-b from-primary-bg/80 to-transparent pointer-events-none">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Stadium Live Map</h2>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-surface flex items-center justify-center relative w-full h-full">
        <div className="text-center animate-pulse">
           <MapIcon className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
           <p className="text-text-muted font-medium">Venue Map Loading...</p>
        </div>
      </div>
    </div>
  )
}
