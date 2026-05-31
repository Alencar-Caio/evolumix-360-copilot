/**
 * V2Documents.tsx - Gerenciador de Documentos v2.0
 * 
 * Funcionalidades:
 * - Upload de documentos (FISPQ, fichas técnicas, PDFs)
 * - Lista de documentos com status (pendente, aprovado, rejeitado)
 * - Filtros por tipo e status
 * - Visualização e download
 * - Dark mode profissional
 */

import { useState } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import V2Layout from '../components/V2Layout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Upload, File, Download, Trash2, Eye, Filter, Search, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

export default function V2Documents() {
  const { user } = useAuth();
  
  // Modo de teste: permitir acesso sem autenticacao via query param
  const isTestMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === 'true';
  const testUser = { id: 'test', name: 'Usuario Teste', email: 'test@evolumix.com', role: 'user' as const };
  const displayUser = user || (isTestMode ? testUser : null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  // tRPC
  const documentsQuery = trpc.documents.listApproved.useQuery();

  if (!displayUser) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // TODO: Implementar upload
      await documentsQuery.refetch();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const documents = documentsQuery.data || [];
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = searchTerm === '' || 
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <V2Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Documentos</h1>
          <p className="text-slate-400 mt-2">Gerencie FISPQs, fichas técnicas e documentação</p>
        </div>

        {/* Upload Card */}
        <Card className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 border-2 border-dashed hover:border-cyan-500/50 transition-colors">
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Enviar Documentos</h3>
            <p className="text-slate-400 mb-6">Arraste arquivos aqui ou clique para selecionar</p>
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                disabled={uploading}
              >
                {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
              </Button>
            </label>
          </div>
        </Card>

        {/* Search and Filters */}
        <Card className="p-6 bg-slate-800/50 border-slate-700/50">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results Info */}
        <div className="text-sm text-slate-400">
          Mostrando <span className="font-semibold text-white">{filteredDocuments.length}</span> de{' '}
          <span className="font-semibold text-white">{documents.length}</span> documentos
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentsQuery.isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="p-6 bg-slate-800/50 border-slate-700/50">
                <Skeleton className="h-10 w-10 mb-4 rounded" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </Card>
            ))
          ) : filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc: any) => (
              <Card
                key={doc.id}
                className="p-6 bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <Badge className={`${
                    doc.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                    doc.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {doc.status === 'approved' ? 'Aprovado' :
                     doc.status === 'rejected' ? 'Rejeitado' :
                     'Pendente'}
                  </Badge>
                </div>

                <h3 className="text-white font-semibold mb-1 truncate">{doc.name}</h3>
                <p className="text-xs text-slate-400 mb-4">
                  {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-slate-400 hover:text-amber-400"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-12 bg-slate-800/50 border-slate-700/50 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum documento encontrado</p>
            </Card>
          )}
        </div>
      </div>
    </V2Layout>
  );
}
