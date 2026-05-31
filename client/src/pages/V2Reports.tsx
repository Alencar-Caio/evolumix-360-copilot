/**
 * V2Reports.tsx - Relatórios e PDFs Gerados v2.0
 * 
 * Funcionalidades:
 * - Lista de PDFs gerados
 * - Download de relatórios
 * - Compartilhamento
 * - Filtros por data
 * - Dark mode profissional
 */

import { useState } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import V2Layout from '../components/V2Layout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Download, Share2, Calendar, File, Search, Filter, AlertCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function V2Reports() {
  const { user } = useAuth();
  
  // Modo de teste: permitir acesso sem autenticacao via query param
  const isTestMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === 'true';
  const testUser = { id: 'test', name: 'Usuario Teste', email: 'test@evolumix.com', role: 'user' as const };
  const displayUser = user || (isTestMode ? testUser : null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  if (!displayUser) return null;

  // Mock data - TODO: Integrar com tRPC
  const reports = [
    {
      id: '1',
      title: 'Diagnóstico #001 - Cliente A',
      date: new Date('2026-05-31'),
      size: '2.4 MB',
      status: 'ready',
    },
    {
      id: '2',
      title: 'Diagnóstico #002 - Cliente B',
      date: new Date('2026-05-30'),
      size: '1.8 MB',
      status: 'ready',
    },
    {
      id: '3',
      title: 'Diagnóstico #003 - Cliente C',
      date: new Date('2026-05-29'),
      size: '3.1 MB',
      status: 'ready',
    },
  ];

  const filteredReports = reports.filter((report) => {
    const matchesSearch = searchTerm === '' ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <V2Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Relatórios</h1>
          <p className="text-slate-400 mt-2">PDFs e relatórios gerados</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-slate-800/50 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Total de Relatórios</p>
            <p className="text-3xl font-bold text-white">{reports.length}</p>
          </Card>
          <Card className="p-6 bg-slate-800/50 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Tamanho Total</p>
            <p className="text-3xl font-bold text-white">7.3 MB</p>
          </Card>
          <Card className="p-6 bg-slate-800/50 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Última Atualização</p>
            <p className="text-3xl font-bold text-white">Hoje</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 bg-slate-800/50 border-slate-700/50">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar relatórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Período</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results Info */}
        <div className="text-sm text-slate-400">
          Mostrando <span className="font-semibold text-white">{filteredReports.length}</span> de{' '}
          <span className="font-semibold text-white">{reports.length}</span> relatórios
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <Card
                key={report.id}
                className="p-6 bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <File className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{report.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {report.date.toLocaleDateString('pt-BR')}
                        </div>
                        <span>{report.size}</span>
                        <Badge className="bg-green-500/20 text-green-300">Pronto</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-amber-400"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 bg-slate-800/50 border-slate-700/50 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum relatório encontrado</p>
            </Card>
          )}
        </div>
      </div>
    </V2Layout>
  );
}
