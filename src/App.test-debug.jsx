// Temporary debug version - remove after fixing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNavbar from './components/layout/TopNavbar';

function AppDebug() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TopNavbar />
      <div className="pt-16 p-8">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p className="text-slate-400">If you see this, the app is working!</p>
      </div>
    </div>
  );
}

export default AppDebug;
