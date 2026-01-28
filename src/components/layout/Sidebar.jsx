import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  History, 
  CreditCard, 
  Settings,
  FileText,
  X 
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { 
      to: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard' 
    },
    { 
      to: '/content', 
      icon: FileText, 
      label: 'Content' 
    },
    { 
      to: '/interview', 
      icon: Video, 
      label: 'Interview' 
    },
    { 
      to: '/history', 
      icon: History, 
      label: 'History' 
    },
    { 
      to: '/payment', 
      icon: CreditCard, 
      label: 'Payment' 
    },
    { 
      to: '/settings', 
      icon: Settings, 
      label: 'Settings' 
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-30',
          'transform transition-transform duration-300 ease-in-out shadow-sm',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                    'text-slate-700 hover:bg-slate-100 hover:text-indigo-600 hover:shadow-sm',
                    isActive && 'bg-indigo-50 text-indigo-600 font-medium shadow-sm'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('w-5 h-5', isActive && 'text-indigo-600')} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <p className="text-xs font-medium text-indigo-900">Need Help?</p>
            <p className="text-xs text-indigo-700 mt-1">
              Check our documentation or contact support
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
