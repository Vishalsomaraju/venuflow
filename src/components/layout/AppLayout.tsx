import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen flex bg-primary-bg text-text-primary">
      <Sidebar />
      <main className="flex-1 md:pl-16 pb-16 md:pb-0 min-h-screen overflow-x-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
