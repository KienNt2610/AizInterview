import { Outlet } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
