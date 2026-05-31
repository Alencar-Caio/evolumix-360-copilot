/**
 * V2Layout.tsx - Layout Principal v2.0 Production-Ready
 * 
 * Arquitetura:
 * - Sidebar colapsável com navegação completa
 * - Header sticky com user info
 * - Dark mode nativo com gradientes
 * - Responsividade mobile-first
 * - Suporte para roles (user, admin)
 * 
 * Componentes filhos:
 * - V2Dashboard, V2Copilot, V2Diagnostics, V2Documents, V2Reports, V2Approvals
 */

import { useState, useMemo } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from './ui/button';
import { 
  Menu, X, LogOut, BarChart3, MessageSquare, FileText, 
  Upload, CheckCircle, Download, Settings, ChevronDown
} from 'lucide-react';

interface V2LayoutProps {
  children: React.ReactNode;
}

/**
 * V2Layout - Wrapper de layout para v2.0
 * 
 * Responsabilidades:
 * 1. Renderizar sidebar com navegação
 * 2. Renderizar header com user info
 * 3. Gerenciar estado de sidebar (aberto/fechado)
 * 4. Filtrar menu items por role
 * 5. Renderizar children (conteúdo dinâmico)
 */
export default function V2Layout({ children }: V2LayoutProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Modo de teste: permitir acesso sem autenticacao via query param
  const isTestMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === 'true';
  const testUser = { id: 'test', name: 'Usuario Teste', email: 'test@evolumix.com', role: 'user' as const };
  const displayUser = user || (isTestMode ? testUser : null);

  // Menu items com roles
  const menuItems = useMemo(() => [
    { 
      icon: BarChart3, 
      label: 'Dashboard', 
      href: '/v2', 
      roles: ['user', 'admin'],
      description: 'Visão geral e KPIs'
    },
    { 
      icon: MessageSquare, 
      label: 'Copiloto', 
      href: '/v2/copilot', 
      roles: ['user', 'admin'],
      description: 'Chat com IA + RAG'
    },
    { 
      icon: FileText, 
      label: 'Diagnósticos', 
      href: '/v2/diagnostics', 
      roles: ['user', 'admin'],
      description: 'Lista de diagnósticos'
    },
    { 
      icon: Upload, 
      label: 'Documentos', 
      href: '/v2/documents', 
      roles: ['user', 'admin'],
      description: 'Upload e gerenciador'
    },
    { 
      icon: Download, 
      label: 'Relatórios', 
      href: '/v2/reports', 
      roles: ['user', 'admin'],
      description: 'PDFs gerados'
    },
    { 
      icon: CheckCircle, 
      label: 'Aprovações', 
      href: '/v2/approvals', 
      roles: ['admin'],
      description: 'Fila de aprovação'
    },
  ], []);

  // Filtrar menu items por role do usuario
  const filteredMenuItems = useMemo(() => 
    menuItems.filter(item => 
      item.roles.includes(displayUser?.role || 'user')
    ),
    [menuItems, displayUser?.role]
  );

  // Verificar se rota está ativa
  const isActive = (href: string) => location === href;

  // Handler para logout
  const handleLogout = async () => {
    await logout();
  };

  if (!displayUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-slate-950/80 border-r border-slate-700/50 backdrop-blur-xl flex flex-col overflow-hidden z-50`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate">Evolumix 360</h1>
              <p className="text-xs text-slate-400">v2.0 Pro</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title={item.description}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Menu */}
        <div className="border-t border-slate-700/50 p-4 space-y-2 flex-shrink-0">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors text-sm">
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Configurações</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors text-sm"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/50 px-6 py-4 flex items-center justify-between flex-shrink-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-slate-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{displayUser?.name || 'Usuario'}</p>
                <p className="text-xs text-slate-400">
                  {displayUser?.role === 'admin' ? '👨‍💼 Administrador' : '👤 Consultor'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {displayUser?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
