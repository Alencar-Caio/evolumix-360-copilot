import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Plus, FileText, MessageSquare, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const diagnosticsQuery = trpc.diagnostics.list.useQuery({ limit: 10 });
  const queriesQuery = trpc.copilot.listHistory.useQuery({ limit: 10 });

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-slate-500 mt-2">
              Bem-vindo de volta, {user.name}. Aqui está seu resumo de atividades.
            </p>
          </div>
          <Link href="/diagnostics/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Diagnóstico
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Diagnósticos</p>
                <p className="text-3xl font-bold">
                  {diagnosticsQuery.isLoading ? <Skeleton className="w-8 h-8" /> : diagnosticsQuery.data?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Consultas</p>
                <p className="text-3xl font-bold">
                  {queriesQuery.isLoading ? <Skeleton className="w-8 h-8" /> : queriesQuery.data?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Pendências</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Aprovados</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Diagnostics */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Diagnósticos Recentes</h2>
              <Link href="/diagnostics">
                <Button variant="ghost" size="sm">
                  Ver Todos
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {diagnosticsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : diagnosticsQuery.data && diagnosticsQuery.data.length > 0 ? (
                diagnosticsQuery.data.map((diagnostic) => (
                  <Link key={diagnostic.id} href={`/diagnostics/${diagnostic.id}`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{diagnostic.clientName}</p>
                          <p className="text-sm text-slate-500">
                            {diagnostic.area}m² • {diagnostic.footTraffic}
                          </p>
                        </div>
                        <Badge
                          variant={
                            diagnostic.status === 'approved'
                              ? 'default'
                              : diagnostic.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {diagnostic.status === 'approved'
                            ? 'Aprovado'
                            : diagnostic.status === 'completed'
                            ? 'Completo'
                            : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8">Nenhum diagnóstico ainda</p>
              )}
            </div>
          </Card>

          {/* Recent Queries */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Consultas Recentes</h2>
              <Link href="/copilot">
                <Button variant="ghost" size="sm">
                  Novo Chat
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {queriesQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : queriesQuery.data && queriesQuery.data.length > 0 ? (
                queriesQuery.data.map((query) => (
                  <Link key={query.id} href={`/copilot/${query.id}`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{query.queryText}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(query.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            query.riskClassification === 'critical'
                              ? 'destructive'
                              : query.riskClassification === 'high'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {query.riskClassification === 'critical'
                            ? 'Crítico'
                            : query.riskClassification === 'high'
                            ? 'Alto'
                            : query.riskClassification === 'medium'
                            ? 'Médio'
                            : 'Baixo'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8">Nenhuma consulta ainda</p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20">
          <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/diagnostics/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Novo Diagnóstico
              </Button>
            </Link>
            <Link href="/copilot">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat Técnico
              </Button>
            </Link>
            <Link href="/documents">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Documentos
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
