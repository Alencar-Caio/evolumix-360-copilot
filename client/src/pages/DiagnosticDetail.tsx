import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, TrendingUp, DollarSign, Calendar, Zap, Shield } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function DiagnosticDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const diagnosticId = parseInt(id || '0');

  const [roiData, setRoiData] = useState({
    costPerLiterDiluted: '',
    yield: '',
    monthlyConsumption: '',
  });

  const [roiResult, setRoiResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const diagnosticQuery = trpc.diagnostics.getById.useQuery({ diagnosticId });
  const roiMutation = trpc.diagnostics.calculateROI.useMutation();

  const handleCalculateROI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    try {
      const result = await roiMutation.mutateAsync({
        diagnosticId,
        costPerLiterDiluted: parseFloat(roiData.costPerLiterDiluted),
        yield: parseFloat(roiData.yield),
        monthlyConsumption: parseFloat(roiData.monthlyConsumption),
      });

      setRoiResult(result);
      toast.success('ROI calculado com sucesso!');
    } catch (error) {
      console.error('Error calculating ROI:', error);
      toast.error('Erro ao calcular ROI. Tente novamente.');
    } finally {
      setIsCalculating(false);
    }
  };

  if (!user) return null;

  if (diagnosticQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!diagnosticQuery.data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Diagnóstico não encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  const diagnostic = diagnosticQuery.data;
  const currentCost = Number(diagnostic.currentCost);
  const currentConsumption = Number(diagnostic.currentConsumption);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{diagnostic.clientName}</h1>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary">{diagnostic.area}m²</Badge>
            <Badge variant="outline">{diagnostic.footTraffic}</Badge>
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

        {/* Tabs */}
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="roi">ROI</TabsTrigger>
            <TabsTrigger value="script">Script Comercial</TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {/* Três Pilares */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Pilar Químico */}
              <Card className="p-6 border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-bold">Químico</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{diagnostic.analysisChemical}</Streamdown>
                </div>
              </Card>

              {/* Pilar Higiene */}
              <Card className="p-6 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold">Higiene</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{diagnostic.analysisHygiene}</Streamdown>
                </div>
              </Card>

              {/* Pilar ROI */}
              <Card className="p-6 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold">ROI</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{diagnostic.analysisROI}</Streamdown>
                </div>
              </Card>
            </div>

            {/* Dados Atuais */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Dados Atuais do Cliente</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Produtos Atuais</p>
                  <p className="font-semibold">
                    {typeof diagnostic.currentProducts === 'string'
                      ? JSON.parse(diagnostic.currentProducts || '[]').join(', ')
                      : (diagnostic.currentProducts as any[]).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Consumo Mensal</p>
                  <p className="font-semibold">{currentConsumption}L/mês</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Custo Mensal Atual</p>
                  <p className="font-semibold">R$ {currentCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Custo por Litro</p>
                  <p className="font-semibold">R$ {(currentCost / currentConsumption).toFixed(2)}/L</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ROI Tab */}
          <TabsContent value="roi" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-6">Calculadora de ROI</h3>

              <form onSubmit={handleCalculateROI} className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Custo por Litro Diluído */}
                  <div className="space-y-2">
                    <Label htmlFor="costPerLiter">Custo por Litro Diluído (R$)</Label>
                    <Input
                      id="costPerLiter"
                      type="number"
                      placeholder="Ex: 15.50"
                      value={roiData.costPerLiterDiluted}
                      onChange={(e) =>
                        setRoiData(prev => ({ ...prev, costPerLiterDiluted: e.target.value }))
                      }
                      required
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">
                      Custo do produto já diluído conforme recomendação técnica
                    </p>
                  </div>

                  {/* Rendimento */}
                  <div className="space-y-2">
                    <Label htmlFor="yield">Rendimento (m²/L)</Label>
                    <Input
                      id="yield"
                      type="number"
                      placeholder="Ex: 50"
                      value={roiData.yield}
                      onChange={(e) =>
                        setRoiData(prev => ({ ...prev, yield: e.target.value }))
                      }
                      required
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">
                      Cobertura do produto por litro
                    </p>
                  </div>

                  {/* Consumo Mensal */}
                  <div className="space-y-2">
                    <Label htmlFor="consumption">Consumo Mensal (L)</Label>
                    <Input
                      id="consumption"
                      type="number"
                      placeholder="Ex: 500"
                      value={roiData.monthlyConsumption}
                      onChange={(e) =>
                        setRoiData(prev => ({ ...prev, monthlyConsumption: e.target.value }))
                      }
                      required
                      step="0.01"
                    />
                    <p className="text-xs text-slate-500">
                      Consumo mensal estimado com novo produto
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    'Calcular ROI'
                  )}
                </Button>
              </form>

              {/* ROI Results */}
              {roiResult && (
                <div className="mt-8 space-y-6">
                  <div className="border-t pt-6">
                    <h4 className="font-bold mb-4">Resultados</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 mb-1">Custo Mensal Atual</p>
                        <p className="text-2xl font-bold">R$ {roiResult.beforeCost.toFixed(2)}</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 mb-1">Custo Mensal Novo</p>
                        <p className="text-2xl font-bold">R$ {roiResult.afterCost.toFixed(2)}</p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300 mb-1">Economia Mensal</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          R$ {roiResult.monthlySavings.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Payback</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {roiResult.paybackMonths.toFixed(1)} meses
                        </p>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 md:col-span-2">
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Economia Anual</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          R$ {(roiResult.monthlySavings * 12).toFixed(2)} ({roiResult.savingsPercentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Script Comercial Tab */}
          <TabsContent value="script" className="space-y-6">
            {roiResult && roiResult.closingScript ? (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Script de Fechamento Comercial</h3>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{roiResult.closingScript}</Streamdown>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-slate-500">
                  Calcule o ROI primeiro para gerar o script de fechamento comercial
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
