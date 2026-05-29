import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Upload, FileText, Trash2, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

export default function DocumentsManager() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    searchTerm: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('FISPQ');

  const documentsQuery = trpc.documents.listAll.useQuery();
  const uploadMutation = trpc.documents.upload.useMutation();

  const handleUpload = async () => {
    if (!selectedFile || !documentTitle) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      await uploadMutation.mutateAsync({
        title: documentTitle,
        documentType: documentType as any,
        fileBuffer: Buffer.from(buffer),
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
      });
      toast.success('Documento enviado com sucesso!');
      setSelectedFile(null);
      setDocumentTitle('');
      documentsQuery.refetch();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erro ao enviar documento. Tente novamente.');
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Gerenciador de Documentos</h1>
            <p className="text-slate-500 mt-2">
              Gerencie FISPQs, fichas técnicas, catálogos e outros documentos técnicos.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Novo Documento</DialogTitle>
                <DialogDescription>
                  Faça upload de um documento técnico (FISPQ, ficha técnica, catálogo, etc.)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Documento</Label>
                  <Input
                    id="title"
                    placeholder="Ex: FISPQ Desinfetante XYZ"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISPQ">FISPQ</SelectItem>
                      <SelectItem value="technical_sheet">Ficha Técnica</SelectItem>
                      <SelectItem value="catalog">Catálogo</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo</Label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-semibold">
                        {selectedFile ? selectedFile.name : 'Clique para selecionar ou arraste um arquivo'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX (máx. 10MB)</p>
                    </label>
                  </div>
                </div>

                <Button
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  disabled={!selectedFile || !documentTitle}
                  onClick={handleUpload}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Documento
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type-filter">Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="FISPQ">FISPQ</SelectItem>
                  <SelectItem value="technical_sheet">Ficha Técnica</SelectItem>
                  <SelectItem value="catalog">Catálogo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por título..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* Documents Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Documentos Técnicos</h2>

          {documentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : documentsQuery.data && documentsQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Título</th>
                    <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Versão</th>
                    <th className="text-left py-3 px-4 font-semibold">Data</th>
                    <th className="text-left py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentsQuery.data.map((doc: any) => (
                    <tr key={doc.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {doc.documentType === 'FISPQ'
                            ? 'FISPQ'
                            : doc.documentType === 'technical_sheet'
                            ? 'Ficha Técnica'
                            : doc.documentType === 'catalog'
                            ? 'Catálogo'
                            : 'Outro'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            doc.status === 'approved'
                              ? 'default'
                              : doc.status === 'draft'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {doc.status === 'approved'
                            ? 'Aprovado'
                            : doc.status === 'draft'
                            ? 'Rascunho'
                            : 'Arquivado'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        v{doc.currentVersionId || 1}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
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
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum documento encontrado</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
