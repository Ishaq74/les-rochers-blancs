import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentLanguageCode = (i18n.resolvedLanguage || i18n.language || 'fr').split('-')[0];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Set RTL for Arabic
    document.documentElement.dir = currentLanguageCode === 'ar' ? 'rtl' : 'ltr';
  }, [currentLanguageCode]);

  const navItems = [
    { key: 'home', href: '#hero' },
    { key: 'hotel', href: '#rooms' },
    { key: 'restaurant', href: '#restaurant' },
    { key: 'menu', href: '#menu' },
    { key: 'access', href: '#access' },
    { key: 'contact', href: '#contact' },
  ];

  const currentLanguage = languages.find((l) => l.code === currentLanguageCode) || languages[0];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      data-site-navbar="true"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-medium'
          : 'bg-transparent'
      }`}
    >
      <div className="container-wide mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-3">
            <span className={`font-serif text-2xl font-bold tracking-wide ${
              isScrolled ? 'text-foreground' : 'text-snow'
            }`}>
              Les Rochers Blancs
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`font-medium transition-colors hover:text-accent ${
                  isScrolled ? 'text-foreground' : 'text-snow'
                }`}
              >
                {t(`nav.${item.key}`)}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isScrolled ? 'text-foreground' : 'text-snow hover:bg-snow/10'}
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`gap-2 ${currentLanguageCode === lang.code ? 'bg-accent/10' : ''}`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={isScrolled ? 'text-foreground' : 'text-snow hover:bg-snow/10'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {/* Book Button */}
            <Button
              asChild
              variant="default"
              className="hidden md:flex bg-accent text-accent-foreground hover:bg-gold-light font-semibold"
            >
              <a href="#contact">{t('nav.book')}</a>
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden ${isScrolled ? 'text-foreground' : 'text-snow hover:bg-snow/10'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-t border-border"
          >
            <div className="container-wide mx-auto px-6 py-6 flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-foreground font-medium py-2 hover:text-accent transition-colors"
                >
                  {t(`nav.${item.key}`)}
                </a>
              ))}
              <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-gold-light">
                <a href="#contact">{t('nav.book')}</a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
