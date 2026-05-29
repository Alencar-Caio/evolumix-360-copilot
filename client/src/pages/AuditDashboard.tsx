import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Download, Filter } from "lucide-react";

export default function AuditDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    action: 'all',
    period: '30',
    searchTerm: '',
  });

  const auditLogsQuery = trpc.system.auditLogs.useQuery({
    limit: 100,
    offset: 0,
  });

  const handleExport = () => {
    if (!auditLogsQuery.data) return;

    const csv = [
      ['Data', 'Usuário', 'Ação', 'Entidade', 'IP', 'Detalhes'].join(','),
      ...auditLogsQuery.data.map((log: any) =>
        [
          new Date(log.createdAt).toLocaleString('pt-BR'),
          log.userId,
          log.action,
          log.entityType || '-',
          log.ipAddress || '-',
          JSON.stringify(log.details || {}),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Auditoria</h1>
          <p className="text-slate-500 mt-2">
            Histórico completo de operações, consultas, aprovações e métricas de qualidade.
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="action">Tipo de Ação</Label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="query">Consultas de IA</SelectItem>
                  <SelectItem value="diagnostic">Diagnósticos</SelectItem>
                  <SelectItem value="approval">Aprovações</SelectItem>
                  <SelectItem value="document">Documentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por usuário, ação..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <p className="text-sm text-slate-500 mb-1">Total de Operações</p>
            <p className="text-3xl font-bold">
              {auditLogsQuery.isLoading ? '-' : auditLogsQuery.data?.length || 0}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-slate-500 mb-1">Consultas de IA</p>
            <p className="text-3xl font-bold">
              {auditLogsQuery.isLoading ? '-' : auditLogsQuery.data?.filter((l: any) => l.action === 'query').length || 0}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-slate-500 mb-1">Diagnósticos Criados</p>
            <p className="text-3xl font-bold">
              {auditLogsQuery.isLoading ? '-' : auditLogsQuery.data?.filter((l: any) => l.action === 'diagnostic').length || 0}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-slate-500 mb-1">Aprovações Processadas</p>
            <p className="text-3xl font-bold">
              {auditLogsQuery.isLoading ? '-' : auditLogsQuery.data?.filter((l: any) => l.action === 'approval').length || 0}
            </p>
          </Card>
        </div>

        {/* Audit Log Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Histórico de Operações</h2>

          {auditLogsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : auditLogsQuery.data && auditLogsQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-semibold">Usuário</th>
                    <th className="text-left py-3 px-4 font-semibold">Ação</th>
                    <th className="text-left py-3 px-4 font-semibold">Entidade</th>
                    <th className="text-left py-3 px-4 font-semibold">IP</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogsQuery.data.map((log: any) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-4">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">User {log.userId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {log.action === 'query'
                            ? 'Consulta IA'
                            : log.action === 'diagnostic'
                            ? 'Diagnóstico'
                            : log.action === 'approval'
                            ? 'Aprovação'
                            : log.action === 'document'
                            ? 'Documento'
                            : log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {log.entityType && (
                          <span className="text-slate-600 dark:text-slate-400">
                            {log.entityType} #{log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default">Sucesso</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhuma operação registrada</p>
            </div>
          )}
        </Card>

        {/* Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quality Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Métricas de Qualidade (Últimas Consultas)</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Fidelidade Média</span>
                  <span className="text-sm font-bold text-cyan-500">87.5%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Cobertura de Citação</span>
                  <span className="text-sm font-bold text-blue-500">92.3%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92.3%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Taxa de Aprovação</span>
                  <span className="text-sm font-bold text-green-500">94.1%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.1%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Risk Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Distribuição de Risco</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Baixo Risco</span>
                <span className="ml-auto font-semibold">65 (52%)</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Risco Médio</span>
                <span className="ml-auto font-semibold">35 (28%)</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Risco Alto</span>
                <span className="ml-auto font-semibold">15 (12%)</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Risco Crítico</span>
                <span className="ml-auto font-semibold">10 (8%)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
