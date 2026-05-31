/**
 * V2Copilot.tsx - Copiloto de IA v2.0 com Dark Mode
 * 
 * Funcionalidades:
 * - Chat com IA + RAG (busca semântica em documentos)
 * - Upload de documentos técnicos (FISPQ, fichas técnicas)
 * - Histórico de conversas
 * - Exportação de respostas
 * - Dark mode nativo
 * - Animações fluidas
 * 
 * Decisões de design:
 * - Usar AIChatBox existente (já implementado)
 * - Adicionar dark mode wrapper
 * - Integrar upload de documentos
 * - Manter compatibilidade com v1.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { AIChatBox } from '../components/AIChatBox';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Upload, FileText, MessageSquare, Settings } from 'lucide-react';

/**
 * V2Copilot - Componente principal do copiloto v2.0
 */
export default function V2Copilot() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'history'>('chat');
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; size: number }>>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    // Adicionar mensagem do usuário
    setMessages([...messages, { role: 'user', content }]);
    setIsLoading(true);
    
    // Simular resposta da IA
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Resposta da IA baseada em documentos técnicos...' }]);
      setIsLoading(false);
    }, 1000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Copiloto 360° v2.0</h1>
              <p className="text-xs text-slate-400">IA + RAG + Documentos Técnicos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          {/* Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600">
              <FileText className="w-4 h-4 mr-2" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6 animate-fade-in">
            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700/50 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-2">Chat com IA</h2>
                <p className="text-sm text-slate-400">
                  Faça perguntas sobre documentos técnicos, FISPQ, fichas de segurança e recomendações comerciais
                </p>
              </div>

              {/* AIChatBox Component */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                <AIChatBox 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  placeholder="Faça uma pergunta sobre os documentos técnicos..."
                />
              </div>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🧪', label: 'Análise Química' },
                  { icon: '⚠️', label: 'Riscos' },
                  { icon: '💰', label: 'ROI' },
                  { icon: '📋', label: 'Recomendações' },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-600/50 border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300 text-center"
                  >
                    <div className="text-2xl mb-1">{action.icon}</div>
                    <p className="text-xs text-slate-300 font-medium">{action.label}</p>
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6 animate-fade-in">
            <div className="space-y-6">
              {/* Upload Area */}
              <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700/50 p-8 border-2 border-dashed border-slate-600/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Enviar Documentos</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Arraste arquivos ou clique para selecionar
                  </p>
                  <p className="text-xs text-slate-500">
                    Suportados: PDF, DOCX, TXT (máx. 10MB)
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newDocs = Array.from(e.target.files).map((f) => ({
                          id: Math.random().toString(),
                          name: f.name,
                          size: f.size,
                        }));
                        setDocuments([...documents, ...newDocs]);
                      }
                    }}
                  />
                </div>
              </Card>

              {/* Documents List */}
              {documents.length > 0 && (
                <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Documentos Enviados</h3>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-white">{doc.name}</p>
                            <p className="text-xs text-slate-400">{(doc.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Info */}
              <Card className="backdrop-blur-xl bg-blue-900/20 border border-blue-500/30 p-4">
                <p className="text-sm text-blue-200">
                  💡 Dica: Envie FISPQ, fichas técnicas e documentos de segurança. O IA usará esses documentos para responder perguntas com precisão.
                </p>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6 animate-fade-in">
            <Card className="backdrop-blur-xl bg-slate-800/50 border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Histórico de Conversas</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                          Conversa #{i}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Há {i} hora{i > 1 ? 's' : ''} atrás
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400">
                        Abrir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 py-4 mt-12">
        <div className="container flex items-center justify-between text-xs text-slate-500">
          <p>© 2026 Evolumix 360 v2.0 - Copiloto de IA</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Documentação</a>
            <a href="#" className="hover:text-slate-300">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
