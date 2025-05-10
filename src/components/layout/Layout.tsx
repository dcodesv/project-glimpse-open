
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { path: "/", icon: Home, label: "Proyectos" },
    { path: "/calendar", icon: Calendar, label: "Calendario" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-primary-600">OpenProject Monitor</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-primary-600 text-white"
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-t border-border">
        <div className="flex justify-around items-center h-16">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-md text-xs transition-colors",
                location.pathname === item.path
                  ? "text-primary-600"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          ))}
          
          {/* Theme toggle for mobile */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center px-3 py-2 text-xs text-muted-foreground"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-5 w-5 mb-1" />
                <span>Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="h-5 w-5 mb-1" />
                <span>Claro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 container py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
