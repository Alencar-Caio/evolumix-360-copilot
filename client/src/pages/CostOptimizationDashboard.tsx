/**
 * Cost Optimization Dashboard
 * 
 * Página para visualizar e gerenciar otimização de custos
 */

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CostOptimizationDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [days, setDays] = useState(30);

  // Queries
  const statsQuery = trpc.costOptimization.getStatistics.useQuery();
  const analysisQuery = trpc.costOptimization.analyzeCosts.useQuery({ period: selectedPeriod, days });
  const projectionsQuery = trpc.costOptimization.projectCosts.useQuery({ months: 6 });
  const recommendationsQuery = trpc.costOptimization.getAllRecommendations.useQuery();

  // Mutations
  const generateRecommendations = trpc.costOptimization.generateRecommendations.useMutation({
    onSuccess: () => {
      recommendationsQuery.refetch();
    },
  });

  const isLoading = statsQuery.isLoading || analysisQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const stats = statsQuery.data;
  const analysis = analysisQuery.data;
  const projections = projectionsQuery.data || [];
  const recommendations = recommendationsQuery.data || [];

  // Preparar dados para gráficos
  const topServicesData = analysis?.topExpensiveServices.map((s) => ({
    name: s.service,
    cost: s.cost,
    percentage: s.percentage,
  })) || [];

  const projectionsData = projections.map((p) => ({
    month: p.month,
    projected: p.projectedCost,
    confidence: p.confidence,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cost Optimization Dashboard</h1>
          <p className="text-gray-600 mt-2">Analise e otimize seus custos operacionais</p>
        </div>
        <Button
          onClick={() => generateRecommendations.mutate()}
          disabled={generateRecommendations.isPending}
        >
          {generateRecommendations.isPending ? 'Gerando...' : 'Gerar Recomendações'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Rastreado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalCostTracked.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{stats?.servicesMonitored} serviços</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.averageCostPerMetric.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">por métrica</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Economia Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats?.potentialSavings.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-gray-500 mt-1">ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod(period);
                  setDays(period === 'daily' ? 7 : period === 'weekly' ? 14 : 30);
                }}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expensive Services */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Caros</CardTitle>
          </CardHeader>
          <CardContent>
            {topServicesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topServicesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }: any) => `${name}: ${Number(percentage).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cost"
                  >
                    {topServicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>

        {/* Cost Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis?.trends && analysis.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysis.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="cost" stroke="#8884d8" name="Custo" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Custos (6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          {projectionsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="projected" fill="#8884d8" name="Custo Projetado" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">Sem dados disponíveis</div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Otimização</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{rec.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${rec.estimatedSavings.toFixed(2)}/mês
                      </div>
                      <div className="text-xs text-gray-500 mt-1">economia potencial</div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      rec.implementationDifficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      rec.implementationDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {rec.implementationDifficulty.toUpperCase()}
                    </span>
                  </div>

                  {rec.actionItems.length > 0 && (
                    <div className="mt-3 text-sm">
                      <p className="font-medium mb-1">Ações:</p>
                      <ul className="list-disc list-inside text-gray-600">
                        {rec.actionItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhuma recomendação gerada. Clique em "Gerar Recomendações" para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
