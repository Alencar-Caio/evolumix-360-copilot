import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function ApprovalsPanel() {
  const { user } = useAuth();
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const approvalsQuery = trpc.approvals.listPending.useQuery();
  const approveMutation = trpc.approvals.approve.useMutation();
  const rejectMutation = trpc.approvals.reject.useMutation();

  const handleApprove = async (queryId: number) => {
    setIsProcessing(true);
    try {
      await approveMutation.mutateAsync({ queryId });
      toast.success('Consulta aprovada com sucesso!');
      approvalsQuery.refetch();
      setSelectedQuery(null);
    } catch (error) {
      console.error('Error approving query:', error);
      toast.error('Erro ao aprovar consulta. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (queryId: number) => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, forneça um motivo para a rejeição.');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectMutation.mutateAsync({ queryId, reason: rejectionReason });
      toast.success('Consulta rejeitada com sucesso!');
      approvalsQuery.refetch();
      setSelectedQuery(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting query:', error);
      toast.error('Erro ao rejeitar consulta. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">Acesso Negado</p>
          <p className="text-sm text-slate-400">Apenas administradores podem acessar este painel.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Painel de Aprovações</h1>
          <p className="text-slate-500 mt-2">
            Revise e aprove consultas de IA classificadas como críticas ou de alto risco.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Pendentes</p>
                <p className="text-3xl font-bold">
                  {approvalsQuery.isLoading ? '-' : approvalsQuery.data?.filter((a: any) => a.status === 'pending').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Aprovadas</p>
                <p className="text-3xl font-bold">
                  {approvalsQuery.isLoading ? '-' : approvalsQuery.data?.filter((a: any) => a.status === 'approved').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Rejeitadas</p>
                <p className="text-3xl font-bold">
                  {approvalsQuery.isLoading ? '-' : approvalsQuery.data?.filter((a: any) => a.status === 'rejected').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Consultas Pendentes de Aprovação</h2>

          {approvalsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : approvalsQuery.data && approvalsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {approvalsQuery.data
                .filter((a: any) => a.status === 'pending')
                .map((approval: any) => (
                  <div
                    key={approval.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{approval.queryText}</p>
                          <Badge
                            variant={
                              approval.riskClassification === 'critical'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {approval.riskClassification === 'critical'
                              ? 'Crítico'
                              : 'Alto'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">
                          Enviado por: <strong>{approval.submittedBy}</strong> • {new Date(approval.submittedAt).toLocaleString('pt-BR')}
                        </p>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div className="bg-white dark:bg-slate-700 p-2 rounded">
                            <p className="text-slate-500 dark:text-slate-400">Fidelidade</p>
                            <p className="font-semibold">{(approval.faithfulnessScore * 100).toFixed(0)}%</p>
                          </div>
                          <div className="bg-white dark:bg-slate-700 p-2 rounded">
                            <p className="text-slate-500 dark:text-slate-400">Cobertura de Citação</p>
                            <p className="font-semibold">{(approval.citationCoverageScore * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Dialog open={selectedQuery?.id === approval.id} onOpenChange={(open) => {
                          if (!open) setSelectedQuery(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedQuery(approval)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Revisar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Revisar Consulta</DialogTitle>
                              <DialogDescription>
                                Analise a resposta da IA antes de aprovar ou rejeitar.
                              </DialogDescription>
                            </DialogHeader>

                            {selectedQuery && (
                              <div className="space-y-6">
                                {/* Query */}
                                <div>
                                  <h4 className="font-semibold mb-2">Pergunta</h4>
                                  <p className="text-slate-600 dark:text-slate-300">{selectedQuery.queryText}</p>
                                </div>

                                {/* Response */}
                                <div>
                                  <h4 className="font-semibold mb-2">Resposta da IA</h4>
                                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                                    <Streamdown>{selectedQuery.response}</Streamdown>
                                  </div>
                                </div>

                                {/* Rejection Reason (if needed) */}
                                <div>
                                  <label className="block text-sm font-semibold mb-2">
                                    Motivo da Rejeição (se aplicável)
                                  </label>
                                  <Textarea
                                    placeholder="Explique por que está rejeitando esta resposta..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-24"
                                  />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    disabled={isProcessing}
                                    onClick={() => handleApprove(selectedQuery.id)}
                                  >
                                    {isProcessing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Aprovando...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Aprovar
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    disabled={isProcessing}
                                    onClick={() => handleReject(selectedQuery.id)}
                                  >
                                    {isProcessing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Rejeitando...
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Rejeitar
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma consulta pendente de aprovação</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
