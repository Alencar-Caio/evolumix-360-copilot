/**
 * Admin Dashboard - Auditoria e Métricas
 * 
 * Página exclusiva para admins visualizar:
 * - Histórico de queries
 * - Métricas de confiabilidade
 * - Documentos mais consultados
 * - Padrões de uso
 * - Alertas de segurança
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditMetrics {
  totalQueries: number;
  averageConfidence: number;
  criticalDiagnostics: number;
  documentsIndexed: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface QueryLog {
  id: number;
  userId: number;
  query: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  responseTime: number;
}

interface DocumentMetrics {
  title: string;
  consultations: number;
  lastAccessed: Date;
  status: 'draft' | 'approved' | 'archived';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AuditMetrics>({
    totalQueries: 0,
    averageConfidence: 0,
    criticalDiagnostics: 0,
    documentsIndexed: 0,
    activeUsers: 0,
    systemHealth: 'healthy',
  });

  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);
  const [documentMetrics, setDocumentMetrics] = useState<DocumentMetrics[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar este dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Carregar métricas (simulado)
  useEffect(() => {
    // Em produção, isso viria de uma API
    setMetrics({
      totalQueries: 1247,
      averageConfidence: 0.87,
      criticalDiagnostics: 12,
      documentsIndexed: 48,
      activeUsers: 23,
      systemHealth: 'healthy',
    });

    // Dados de exemplo para gráfico
    setChartData([
      { time: '00:00', queries: 45, avgConfidence: 0.85 },
      { time: '04:00', queries: 52, avgConfidence: 0.86 },
      { time: '08:00', queries: 78, avgConfidence: 0.88 },
      { time: '12:00', queries: 95, avgConfidence: 0.87 },
      { time: '16:00', queries: 82, avgConfidence: 0.89 },
      { time: '20:00', queries: 68, avgConfidence: 0.86 },
    ]);

    // Logs de exemplo
    setQueryLogs([
      {
        id: 1,
        userId: 1,
        query: 'Qual é o risco químico de exposição a formaldeído?',
        confidence: 0.92,
        riskLevel: 'high',
        timestamp: new Date(),
        responseTime: 1240,
      },
      {
        id: 2,
        userId: 2,
        query: 'Protocolo de higiene para área contaminada',
        confidence: 0.88,
        riskLevel: 'medium',
        timestamp: new Date(Date.now() - 3600000),
        responseTime: 980,
      },
    ]);

    // Documentos mais consultados
    setDocumentMetrics([
      {
        title: 'FISPQ - Formaldeído',
        consultations: 156,
        lastAccessed: new Date(),
        status: 'approved',
      },
      {
        title: 'Protocolo de Higiene Ocupacional',
        consultations: 124,
        lastAccessed: new Date(Date.now() - 7200000),
        status: 'approved',
      },
      {
        title: 'Guia de Segurança Química',
        consultations: 98,
        lastAccessed: new Date(Date.now() - 86400000),
        status: 'approved',
      },
    ]);
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard de Auditoria</h1>
          <p className="text-slate-400">Métricas e monitoramento do sistema</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Total de Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{metrics.totalQueries}</div>
              <p className="text-slate-400 text-sm mt-2">Últimas 24 horas</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Confiabilidade Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{(metrics.averageConfidence * 100).toFixed(0)}%</div>
              <p className="text-slate-400 text-sm mt-2">Score de confiança</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Diagnósticos Críticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{metrics.criticalDiagnostics}</div>
              <p className="text-slate-400 text-sm mt-2">Requerem aprovação</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Documentos Indexados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{metrics.documentsIndexed}</div>
              <p className="text-slate-400 text-sm mt-2">No RAG</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{metrics.activeUsers}</div>
              <p className="text-slate-400 text-sm mt-2">Conectados agora</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Saúde do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${getHealthColor(metrics.systemHealth)} capitalize`}>
                {metrics.systemHealth}
              </Badge>
              <p className="text-slate-400 text-sm mt-2">Status operacional</p>
            </CardContent>
          </Card>
        </div>

        {/* Abas */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="analytics" className="text-slate-300">Análise</TabsTrigger>
            <TabsTrigger value="logs" className="text-slate-300">Logs</TabsTrigger>
            <TabsTrigger value="documents" className="text-slate-300">Documentos</TabsTrigger>
          </TabsList>

          {/* Analytics */}
          <TabsContent value="analytics">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Atividade por Hora</CardTitle>
                <CardDescription className="text-slate-400">Queries e confiabilidade média</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                  Gráfico de atividade (Recharts)
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs */}
          <TabsContent value="logs">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Histórico de Queries</CardTitle>
                <CardDescription className="text-slate-400">Últimas 100 queries do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queryLogs.map((log) => (
                    <div key={log.id} className="border-b border-slate-700 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-slate-200 font-medium">{log.query}</p>
                          <p className="text-slate-400 text-sm">Usuário #{log.userId}</p>
                        </div>
                        <Badge className={getRiskColor(log.riskLevel)}>
                          {log.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Confiança: {(log.confidence * 100).toFixed(0)}%</span>
                        <span>{log.responseTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documents">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Documentos Mais Consultados</CardTitle>
                <CardDescription className="text-slate-400">Top documentos no RAG</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentMetrics.map((doc, idx) => (
                    <div key={idx} className="border-b border-slate-700 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-slate-200 font-medium">{doc.title}</p>
                          <p className="text-slate-400 text-sm">
                            {doc.consultations} consultações
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {doc.status}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm">
                        Último acesso: {doc.lastAccessed.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ações */}
        <div className="mt-8 flex gap-4">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Exportar Relatório
          </Button>
          <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-700">
            Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
