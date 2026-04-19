import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquareText, Shield, LogOut, User, ShieldCheck } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../ThemeToggle';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', staffOnly: false },
  { path: '/map', icon: Map, label: 'Venue Map', staffOnly: false },
  { path: '/assistant', icon: MessageSquareText, label: 'Assistant', staffOnly: false },
  { path: '/admin', icon: Shield, label: 'Admin', staffOnly: false },
  { path: '/staff', icon: ShieldCheck, label: 'Staff Panel', staffOnly: true },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const isStaff = useAuthStore((s) => s.isStaff());

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-primary-bg/80 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={cn(
          "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-surface/60 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col justify-between",
          sidebarOpen ? "w-60" : "w-16 md:w-16 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col py-6">
          <div className="flex items-center justify-center h-12 mb-8">
            <span className={cn("text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light transition-opacity duration-300", sidebarOpen ? "opacity-100" : "opacity-0 hidden")}>
              VenueFlow
            </span>
            <span className={cn("text-xl font-bold text-primary transition-opacity duration-300", sidebarOpen ? "opacity-0 hidden" : "opacity-100")}>
              VF
            </span>
          </div>

          <nav className="flex flex-col gap-2 px-3">
            {navItems.filter((item) => !item.staffOnly || isStaff).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-3 rounded-xl transition-all relative overflow-hidden group",
                    isActive
                      ? "text-primary bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/80"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-text-muted group-hover:text-text-primary")} />
                    <span
                      className={cn(
                        "ml-3 font-medium tracking-wide whitespace-nowrap transition-opacity duration-300",
                        sidebarOpen ? "opacity-100" : "opacity-0 hidden"
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col px-3 pb-6 gap-2">
          {/* Theme Toggle */}
          <div className={cn(
            "flex items-center justify-center py-2 transition-all duration-300",
            sidebarOpen ? "px-3 justify-start" : ""
          )}>
            <ThemeToggle />
            {sidebarOpen && <span className="ml-3 text-sm font-medium text-text-secondary">Theme</span>}
          </div>

          {/* User Profile */}
          <div className={cn(
            "flex items-center px-3 py-3 rounded-xl bg-surface-light/50 text-text-secondary hover:text-text-primary cursor-pointer transition-colors mt-2",
            sidebarOpen ? "" : "justify-center"
          )} aria-label="User profile">
            <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center shrink-0 shadow-sm">
              <User className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <div className={cn("ml-3 overflow-hidden transition-all duration-300", sidebarOpen ? "opacity-100 w-full flex items-center justify-between" : "opacity-0 w-0")}>
              <p className="text-sm font-medium text-text-primary truncate">Staff Member</p>
              <button aria-label="Log out" className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm p-1 hover:bg-accent-red/10 group">
                <LogOut className="w-4 h-4 shrink-0 text-text-muted group-hover:text-accent-red transition-colors" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.02)] flex justify-around items-center h-16 pb-safe">
        {navItems.filter((item) => !item.staffOnly || isStaff).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 relative",
              isActive ? "text-primary" : "text-text-secondary"
            )}
          >
             {({ isActive }) => (
               <>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-text-muted")} />
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="mobile-active" className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-md" />
                  )}
               </>
             )}
          </NavLink>
        ))}
      </div>
    </>
  );
}
