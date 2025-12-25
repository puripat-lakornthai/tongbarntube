import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Sun, Moon, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguage';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  autoHide?: boolean;
  alwaysShow?: boolean;
}

export function Navbar({ theme, toggleTheme, language, toggleLanguage, t, autoHide = false, alwaysShow = false }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(!autoHide);
  const [isHovered, setIsHovered] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [themeAnimating, setThemeAnimating] = useState(false);
  const [langAnimating, setLangAnimating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (autoHide || alwaysShow) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, autoHide, alwaysShow]);

  const showNavbar = alwaysShow ? true : (!autoHide ? isVisible : (isVisible || isHovered));

  const isHome = location.pathname === '/';

  const handleThemeToggle = () => {
    setThemeAnimating(true);
    toggleTheme();
    setTimeout(() => setThemeAnimating(false), 300);
  };

  const handleLangToggle = () => {
    setLangAnimating(true);
    toggleLanguage();
    setTimeout(() => setLangAnimating(false), 300);
  };

  return (
    <>
      {/* Hover Trigger Zone for Auto-Hide Mode */}
      {autoHide && (
        <div
          className="fixed top-0 left-0 right-0 h-6 z-[60] bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}

      <nav
        className={cn(
          "fixed top-2 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out origin-top",
          showNavbar ? "translate-y-0 opacity-100 scale-y-100" : "-translate-y-full opacity-0 scale-y-0",
          "w-[95%] max-w-2xl rounded-2xl",
          "glass-premium border border-white/10 shadow-2xl shadow-primary/10"
        )}
        onMouseEnter={() => autoHide && setIsHovered(true)}
        onMouseLeave={() => autoHide && setIsHovered(false)}
      >
        <div className="px-6 py-2">
          <div className="flex items-center justify-between h-10">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Tongbarn<span className="text-gradient">Tube</span>
              </span>
            </Link>

            {/* Right Side Actions - Inline Icons */}
            <div className="flex items-center gap-1 pl-4 border-l border-border/20 ml-2">
              {/* Home button (only show when not on home) */}
              {!isHome && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-200"
                >
                  <Link to="/">
                    <Home className="w-4 h-4" />
                  </Link>
                </Button>
              )}

              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLangToggle}
                className={cn(
                  "h-8 px-3 rounded-full font-medium text-xs hover:bg-primary/10 transition-all duration-200",
                  langAnimating && "scale-90"
                )}
              >
                <span className={cn(
                  "transition-all duration-200",
                  langAnimating && "opacity-0 scale-50"
                )}>
                  {language === 'en' ? 'TH' : 'EN'}
                </span>
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className={cn(
                  "h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-200",
                  themeAnimating && "rotate-180"
                )}
              >
                <div className={cn(
                  "transition-all duration-300",
                  themeAnimating && "scale-0"
                )}>
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}
