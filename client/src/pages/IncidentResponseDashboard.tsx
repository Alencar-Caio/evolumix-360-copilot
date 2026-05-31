/**
 * Incident Response Dashboard
 * 
 * Página para gerenciar e responder a incidentes de segurança
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function IncidentResponseDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'security_breach' as const,
    severity: 'high' as const,
    title: '',
    description: '',
    affectedSystems: [] as string[],
  });

  // Queries
  const incidentsQuery = trpc.incidentResponse.getOpenIncidents.useQuery();
  const statsQuery = trpc.incidentResponse.getStatistics.useQuery();
  const actionsQuery = selectedIncident
    ? trpc.incidentResponse.getIncident.useQuery({ incidentId: selectedIncident })
    : { data: undefined, isLoading: false };

  // Mutations
  const createIncident = trpc.incidentResponse.createIncident.useMutation({
    onSuccess: () => {
      incidentsQuery.refetch();
      setFormData({ type: 'security_breach', severity: 'high', title: '', description: '', affectedSystems: [] });
      setIsCreateOpen(false);
    },
  });

  const updateStatus = trpc.incidentResponse.updateStatus.useMutation({
    onSuccess: () => {
      incidentsQuery.refetch();
    },
  });

  const addAction = trpc.incidentResponse.addAction.useMutation({
    onSuccess: () => {
      if (selectedIncident) {
        // Refetch incident data
      }
    },
  });

  const isLoading = incidentsQuery.isLoading || statsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const incidents = incidentsQuery.data || [];
  const stats = statsQuery.data;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'contained':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Incident Response Dashboard</h1>
          <p className="text-gray-600 mt-2">Gerencie e responda a incidentes de segurança</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Criar Incidente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Incidente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_breach">Security Breach</SelectItem>
                    <SelectItem value="data_loss">Data Loss</SelectItem>
                    <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                    <SelectItem value="malware_detected">Malware Detected</SelectItem>
                    <SelectItem value="ddos_attack">DDoS Attack</SelectItem>
                    <SelectItem value="service_degradation">Service Degradation</SelectItem>
                    <SelectItem value="configuration_error">Configuration Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Severidade</label>
                <Select value={formData.severity} onValueChange={(value: any) => setFormData({ ...formData, severity: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do incidente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do incidente"
                  rows={4}
                />
              </div>

              <Button
                onClick={() => createIncident.mutate(formData)}
                disabled={createIncident.isPending}
                className="w-full"
              >
                {createIncident.isPending ? 'Criando...' : 'Criar Incidente'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Incidentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIncidents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.openIncidents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">MTTR Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.mttr || 0}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.resolutionRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Incidentes Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedIncident(incident.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-2 justify-end mb-2">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(incident.detectedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {incident.affectedSystems && incident.affectedSystems.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium mb-1">Sistemas Afetados:</p>
                      <div className="flex flex-wrap gap-1">
                        {incident.affectedSystems.map((system: any, idx: any) => (
                          <Badge key={idx} variant="outline">{system}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    {incident.status !== 'closed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({
                              incidentId: incident.id,
                              status: incident.status === 'open' ? 'investigating' : 'contained',
                            });
                          }}
                        >
                          Avançar Status
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({
                              incidentId: incident.id,
                              status: 'resolved',
                            });
                          }}
                        >
                          Resolver
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Nenhum incidente registrado</div>
          )}
        </CardContent>
      </Card>

      {/* Selected Incident Actions */}
      {selectedIncident && (
        <Card>
          <CardHeader>
            <CardTitle>Ações do Incidente</CardTitle>
          </CardHeader>
          <CardContent>
            {actionsQuery.data && typeof actionsQuery.data === 'object' && 'actions' in actionsQuery.data && Array.isArray(actionsQuery.data.actions) && actionsQuery.data.actions.length > 0 ? (
              <div className="space-y-3">
                {(actionsQuery.data as any).actions.map((action: any) => (
                  <div key={action.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{action.action}</p>
                        <p className="text-sm text-gray-600">Por: {action.performer}</p>
                        {action.notes && <p className="text-sm mt-1">{action.notes}</p>}
                      </div>
                      <Badge variant="outline">{action.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">Nenhuma ação registrada</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
