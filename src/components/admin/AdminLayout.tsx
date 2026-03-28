import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  FileText, 
  UtensilsCrossed, 
  LogOut, 
  Home,
  Briefcase,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Users,
  Receipt,
  FileSpreadsheet,
  Calendar,
  Image,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', labelKey: 'adminLayout.nav.dashboard', icon: LayoutDashboard },
  { path: '/admin/content', labelKey: 'adminLayout.nav.content', icon: FileText },
  { path: '/admin/menu', labelKey: 'adminLayout.nav.menu', icon: UtensilsCrossed },
  { path: '/admin/services', labelKey: 'adminLayout.nav.services', icon: Briefcase },
  { path: '/admin/formations', labelKey: 'adminLayout.nav.formations', icon: GraduationCap },
  { path: '/admin/blog', labelKey: 'adminLayout.nav.blog', icon: BookOpen },
  { path: '/admin/commentaires', labelKey: 'adminLayout.nav.comments', icon: MessageSquare },
  { path: '/admin/clients', labelKey: 'adminLayout.nav.clients', icon: Users },
  { path: '/admin/reservations', labelKey: 'adminLayout.nav.reservations', icon: Calendar },
  { path: '/admin/factures', labelKey: 'adminLayout.nav.invoices', icon: Receipt },
  { path: '/admin/devis', labelKey: 'adminLayout.nav.quotes', icon: FileSpreadsheet },
  { path: '/admin/medias', labelKey: 'adminLayout.nav.media', icon: Image },
  { path: '/admin/theme', labelKey: 'adminLayout.nav.theme', icon: Palette },
  { path: '/admin/parametres', labelKey: 'adminLayout.nav.settings', icon: Settings },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link 
            to="/" 
            className={cn(
              "flex items-center gap-2 text-foreground hover:text-accent transition-colors",
              collapsed && "justify-center"
            )}
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-serif font-bold text-sm">Les Rochers Blancs</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("flex-shrink-0", collapsed && "hidden lg:flex")}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? t(item.labelKey) : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium text-sm">{t(item.labelKey)}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-2 border-t border-border space-y-2">
          {!collapsed && (
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              {user?.email}
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground hover:text-destructive",
              collapsed ? "justify-center px-2" : "justify-start gap-3"
            )}
            onClick={handleSignOut}
            title={collapsed ? t('adminLayout.signOut') : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{t('adminLayout.signOut')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
