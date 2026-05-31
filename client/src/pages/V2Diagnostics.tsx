/**
 * V2Diagnostics.tsx - Página de Diagnósticos v2.0
 * 
 * Funcionalidades:
 * - Criar novo diagnóstico
 * - Listar diagnósticos
 * - Visualizar detalhes
 * - Exportar para PDF
 * - Sincronizar com CRM
 * - Dark mode + animações
 */

import { useState } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, FileDown, Share2, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function V2Diagnostics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'analytics'>('list');

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Diagnósticos 360°</h1>
              <p className="text-xs text-slate-400">Análise técnica-comercial</p>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Diagnóstico
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="list" className="data-[state=active]:bg-blue-600">
              Lista
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-blue-600">
              Novo
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
              Análise
            </TabsTrigger>
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="mt-6 animate-fade-in">
            <div className="space-y-4">
              {[
                { id: 1, title: 'Diagnóstico #001', client: 'Cliente A', status: 'Aprovado', roi: 'R$ 45.000' },
                { id: 2, title: 'Diagnóstico #002', client: 'Cliente B', status: 'Pendente', roi: 'R$ 32.000' },
                { id: 3, title: 'Diagnóstico #003', client: 'Cliente C', status: 'Em Análise', roi: 'R$ 58.000' },
              ].map((diag) => (
                <Card
                  key={diag.id}
                  className="backdrop-blur-xl bg-slate-800/50 border-slate-700/50 p-4 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                          {diag.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            diag.status === 'Aprovado'
                              ? 'bg-green-500/20 text-green-300'
                              : diag.status === 'Pendente'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {diag.status}
                        </span>
                      </div>
                      <div className="flex gap-6 text-sm text-slate-400">
                        <span>Cliente: {diag.client}</span>
                        <span className="text-green-400 font-medium">ROI: {diag.roi}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400">
                        <FileDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-green-400">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* New Diagnostic Tab */}
          <TabsContent value="new" className="mt-6 animate-fade-in">
            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white mb-6">Novo Diagnóstico</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                    placeholder="Digite o nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                    placeholder="Descreva o diagnóstico"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Criar Diagnóstico
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-slate-300">
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total de Diagnósticos', value: '42', icon: '📊' },
                { label: 'Taxa de Aprovação', value: '94%', icon: '✅' },
                { label: 'ROI Médio', value: 'R$ 45k', icon: '💰' },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="backdrop-blur-xl bg-slate-800/50 border-slate-700/50 p-6 hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 py-4 mt-12">
        <div className="container flex items-center justify-between text-xs text-slate-500">
          <p>© 2026 Evolumix 360 v2.0</p>
        </div>
      </footer>
    </div>
  );
}
