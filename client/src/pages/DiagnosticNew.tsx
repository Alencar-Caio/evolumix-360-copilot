import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DiagnosticNew() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    area: '',
    footTraffic: 'médio',
    currentProducts: '',
    currentConsumption: '',
    currentCost: '',
  });

  const createMutation = trpc.diagnostics.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const products = formData.currentProducts
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const result = await createMutation.mutateAsync({
        clientName: formData.clientName,
        area: parseFloat(formData.area),
        footTraffic: formData.footTraffic,
        currentProducts: products,
        currentConsumption: parseFloat(formData.currentConsumption),
        currentCost: parseFloat(formData.currentCost),
      });

      toast.success('Diagnóstico criado com sucesso!');
      setLocation(`/diagnostics/${result.diagnosticId}`);
    } catch (error) {
      console.error('Error creating diagnostic:', error);
      toast.error('Erro ao criar diagnóstico. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Novo Diagnóstico 360º</h1>
          <p className="text-slate-500 mt-2">
            Preencha os dados do cliente para gerar uma análise estruturada nos três pilares.
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                placeholder="Ex: Empresa XYZ Ltda"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                required
              />
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="area">Área (m²)</Label>
              <Input
                id="area"
                type="number"
                placeholder="Ex: 5000"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                required
                step="0.01"
              />
            </div>

            {/* Foot Traffic */}
            <div className="space-y-2">
              <Label htmlFor="footTraffic">Fluxo de Pessoas</Label>
              <Select value={formData.footTraffic} onValueChange={(value) => setFormData(prev => ({ ...prev, footTraffic: value }))}>
                <SelectTrigger id="footTraffic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo (até 100 pessoas/dia)</SelectItem>
                  <SelectItem value="médio">Médio (100-500 pessoas/dia)</SelectItem>
                  <SelectItem value="alto">Alto (500-1000 pessoas/dia)</SelectItem>
                  <SelectItem value="muito-alto">Muito Alto (mais de 1000 pessoas/dia)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Products */}
            <div className="space-y-2">
              <Label htmlFor="currentProducts">Produtos Atuais (separados por vírgula)</Label>
              <Input
                id="currentProducts"
                placeholder="Ex: Detergente X, Desinfetante Y, Cera Z"
                value={formData.currentProducts}
                onChange={(e) => setFormData(prev => ({ ...prev, currentProducts: e.target.value }))}
                required
              />
            </div>

            {/* Current Consumption */}
            <div className="space-y-2">
              <Label htmlFor="currentConsumption">Consumo Atual (L/mês)</Label>
              <Input
                id="currentConsumption"
                type="number"
                placeholder="Ex: 500"
                value={formData.currentConsumption}
                onChange={(e) => setFormData(prev => ({ ...prev, currentConsumption: e.target.value }))}
                required
                step="0.01"
              />
            </div>

            {/* Current Cost */}
            <div className="space-y-2">
              <Label htmlFor="currentCost">Custo Atual (R$/mês)</Label>
              <Input
                id="currentCost"
                type="number"
                placeholder="Ex: 5000"
                value={formData.currentCost}
                onChange={(e) => setFormData(prev => ({ ...prev, currentCost: e.target.value }))}
                required
                step="0.01"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">Análise Estruturada</p>
                <p>
                  Após enviar este formulário, o sistema gerará uma análise profunda nos três pilares:
                  <strong> Químico</strong>, <strong>Higiene</strong> e <strong>ROI</strong>.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Diagnóstico...
                  </>
                ) : (
                  'Gerar Diagnóstico'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/diagnostics')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
