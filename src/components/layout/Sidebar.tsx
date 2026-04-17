import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquareText, Shield, LogOut, User } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/map', icon: Map, label: 'Venue Map' },
  { path: '/assistant', icon: MessageSquareText, label: 'Assistant' },
  { path: '/admin', icon: Shield, label: 'Admin' },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

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
            className="fixed inset-0 z-40 bg-black/80 md:hidden"
          />
        )}
      </AnimatePresence>

      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={cn(
          "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out border-r border-surface-border bg-surface flex flex-col justify-between",
          sidebarOpen ? "w-60" : "w-16 md:w-16 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col py-4">
          <div className="flex items-center justify-center h-12 mb-6">
            <span className={cn("text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light transition-opacity duration-300", sidebarOpen ? "opacity-100" : "opacity-0 hidden")}>
              VenueFlow
            </span>
            <span className={cn("text-xl font-bold text-primary transition-opacity duration-300", sidebarOpen ? "opacity-0 hidden" : "opacity-100")}>
              VF
            </span>
          </div>

          <nav className="flex flex-col gap-2 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-3 rounded-md transition-colors relative overflow-hidden group",
                    isActive
                      ? "text-text-primary bg-primary/10"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-light"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-md" />
                    )}
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary")} />
                    <span
                      className={cn(
                        "ml-3 whitespace-nowrap transition-opacity duration-300",
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

        <div className="p-2 border-t border-surface-border">
          <div className={cn(
            "flex items-center px-3 py-3 rounded-md text-text-muted hover:text-text-primary cursor-pointer transition-colors",
            sidebarOpen ? "" : "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className={cn("ml-3 overflow-hidden transition-all duration-300", sidebarOpen ? "opacity-100 w-full flex items-center justify-between" : "opacity-0 w-0")}>
              <p className="text-sm font-medium text-text-primary truncate">Staff Member</p>
              <LogOut className="w-4 h-4 ml-auto shrink-0 text-text-muted hover:text-accent-red transition-colors" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-surface flex justify-around items-center h-16 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 relative",
              isActive ? "text-accent" : "text-text-muted"
            )}
          >
             {({ isActive }) => (
               <>
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px]">{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="mobile-active" className="absolute top-0 w-8 h-0.5 bg-accent rounded-b-md" />
                  )}
               </>
             )}
          </NavLink>
        ))}
      </div>
    </>
  );
}
