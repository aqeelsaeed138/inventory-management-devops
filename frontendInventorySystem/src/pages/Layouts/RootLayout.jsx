import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Grid, 
  ShoppingCart, 
  Truck, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

function InventoryLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'Categories', icon: Grid, path: '/categories' },
    { name: 'Orders', icon: ShoppingCart, path: '/orders' },
    { name: 'Suppliers', icon: Truck, path: '/suppliers' },
    { name: 'Users', icon: User, path: '/users' },
    { name: 'Profile', icon: Settings, path: '/profile' },
  ];

  // Update active item based on current route
  useEffect(() => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    if (currentItem) {
      setActiveItem(currentItem.name);
    }
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Handle navigation
  const handleNavigation = (item) => {
    setActiveItem(item.name);
    navigate(item.path);
    setIsMobileMenuOpen(false); // Close menu on navigation
  };

  // Handle logout
  const handleLogout = () => {
    // Add your logout logic here (clear tokens, user data, etc.)
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* ============ DESKTOP SIDEBAR (≥1024px) ============ */}
      <aside className="hidden lg:flex lg:w-64 bg-white border-r border-gray-200 flex-col shrink-0">
        {/* Logo Section */}
        <div className="h-16 xl:h-20 flex items-center px-4 xl:px-6 border-b border-gray-200 shrink-0">
          <h1 
            className="text-xl xl:text-2xl font-bold text-gray-800 cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            Inventory <span className="text-blue-600">MS</span>
          </h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 xl:px-4 py-4 xl:py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.name;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm xl:text-base">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="px-3 xl:px-4 py-4 xl:py-6 border-t border-gray-200 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 border border-transparent hover:border-red-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm xl:text-base">Logout</span>
          </button>
        </div>
      </aside>

      {/* ============ MOBILE/TABLET HEADER (<1024px) ============ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo - Centered on Mobile */}
        <h1 
          className="text-lg sm:text-xl font-bold text-gray-800 cursor-pointer absolute left-1/2 transform -translate-x-1/2" 
          onClick={() => {
            navigate('/dashboard');
            setIsMobileMenuOpen(false);
          }}
        >
          Inventory <span className="text-blue-600">MS</span>
        </h1>

        {/* Spacer for symmetry */}
        <div className="w-10"></div>
      </div>

      {/* ============ MOBILE MENU OVERLAY ============ */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      {/* ============ MOBILE SLIDING MENU ============ */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 sm:w-80 bg-white border-r border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <h1 
            className="text-xl font-bold text-gray-800 cursor-pointer" 
            onClick={() => {
              navigate('/dashboard');
              setIsMobileMenuOpen(false);
            }}
          >
            Inventory <span className="text-blue-600">MS</span>
          </h1>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.name;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-transparent active:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Logout Section */}
        <div className="px-4 py-6 border-t border-gray-200 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 border border-transparent hover:border-red-200 active:bg-red-100"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ============ MAIN CONTENT AREA ============ */}
      <main className="flex-1 bg-gray-50 overflow-auto pt-16 lg:pt-0">
        {/* Content wrapper for proper padding */}
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export { InventoryLayout };