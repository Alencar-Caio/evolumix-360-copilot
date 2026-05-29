import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Users, CheckCircle, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

export default function UsersManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'authorized' | 'unauthorized'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const allUsersQuery = trpc.users.listAll.useQuery();
  const authorizedUsersQuery = trpc.users.listAuthorized.useQuery();
  const unauthorizedUsersQuery = trpc.users.listUnauthorized.useQuery();
  const authorizeMutation = trpc.users.authorize.useMutation();
  const unauthorizeMutation = trpc.users.unauthorize.useMutation();

  const handleAuthorize = async (userId: number) => {
    try {
      await authorizeMutation.mutateAsync({ userId });
      toast.success('Usuário autorizado com sucesso!');
      allUsersQuery.refetch();
      authorizedUsersQuery.refetch();
      unauthorizedUsersQuery.refetch();
    } catch (error) {
      toast.error('Erro ao autorizar usuário');
    }
  };

  const handleUnauthorize = async (userId: number) => {
    try {
      await unauthorizeMutation.mutateAsync({ userId, reason: 'Desautorizado pelo administrador' });
      toast.success('Usuário desautorizado com sucesso!');
      allUsersQuery.refetch();
      authorizedUsersQuery.refetch();
      unauthorizedUsersQuery.refetch();
    } catch (error) {
      toast.error('Erro ao desautorizar usuário');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-500 font-semibold">Acesso Negado</p>
          <p className="text-sm text-slate-400">Apenas administradores podem acessar este painel.</p>
        </div>
      </DashboardLayout>
    );
  }

  const displayedUsers =
    selectedTab === 'authorized'
      ? authorizedUsersQuery.data || []
      : selectedTab === 'unauthorized'
      ? unauthorizedUsersQuery.data || []
      : allUsersQuery.data || [];

  const filteredUsers = displayedUsers.filter(
    (u: any) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-slate-500 mt-2">
            Autorize ou desautorize usuários para acessar a plataforma Evolumix 360.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Usuários</p>
                <p className="text-3xl font-bold mt-2">{allUsersQuery.data?.length || 0}</p>
              </div>
              <Users className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Autorizados</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{authorizedUsersQuery.data?.length || 0}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Não Autorizados</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{unauthorizedUsersQuery.data?.length || 0}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Tabs and Search */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex gap-2">
              {(['all', 'authorized', 'unauthorized'] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={selectedTab === tab ? 'default' : 'outline'}
                  onClick={() => setSelectedTab(tab)}
                  className={selectedTab === tab ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
                >
                  {tab === 'all' ? 'Todos' : tab === 'authorized' ? 'Autorizados' : 'Não Autorizados'}
                </Button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          {allUsersQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Papel</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Data de Cadastro</th>
                    <th className="text-left py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-4 font-semibold">{u.name || 'Sem nome'}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role === 'admin' ? 'Admin' : 'Consultor'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={u.isAuthorized ? 'default' : 'outline'}
                          className={u.isAuthorized ? 'bg-green-600' : 'bg-red-600'}
                        >
                          {u.isAuthorized ? 'Autorizado' : 'Não Autorizado'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {u.isAuthorized ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              disabled={unauthorizeMutation.isPending}
                              onClick={() => handleUnauthorize(u.id)}
                            >
                              {unauthorizeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              disabled={authorizeMutation.isPending}
                              onClick={() => handleAuthorize(u.id)}
                            >
                              {authorizeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDetails(true);
                            }}
                          >
                            Detalhes
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </Card>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Nome</p>
                <p className="font-semibold">{selectedUser.name || 'Sem nome'}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-semibold">{selectedUser.email}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Papel</p>
                <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                  {selectedUser.role === 'admin' ? 'Admin' : 'Consultor'}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-slate-500">Status de Autorização</p>
                <Badge
                  variant={selectedUser.isAuthorized ? 'default' : 'outline'}
                  className={selectedUser.isAuthorized ? 'bg-green-600' : 'bg-red-600'}
                >
                  {selectedUser.isAuthorized ? 'Autorizado' : 'Não Autorizado'}
                </Badge>
              </div>

              {selectedUser.authorizationReason && (
                <div>
                  <p className="text-sm text-slate-500">Motivo</p>
                  <p className="text-sm">{selectedUser.authorizationReason}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500">Data de Cadastro</p>
                <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString('pt-BR')}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Último Acesso</p>
                <p className="text-sm">{new Date(selectedUser.lastSignedIn).toLocaleString('pt-BR')}</p>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedUser.isAuthorized ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={unauthorizeMutation.isPending}
                    onClick={() => {
                      handleUnauthorize(selectedUser.id);
                      setShowDetails(false);
                    }}
                  >
                    {unauthorizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Desautorizando...
                      </>
                    ) : (
                      'Desautorizar'
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={authorizeMutation.isPending}
                    onClick={() => {
                      handleAuthorize(selectedUser.id);
                      setShowDetails(false);
                    }}
                  >
                    {authorizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Autorizando...
                      </>
                    ) : (
                      'Autorizar'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
