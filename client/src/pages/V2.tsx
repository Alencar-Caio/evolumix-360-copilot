/**
 * V2.tsx - Plataforma de Trabalho v2.0 (Production-Ready)
 * 
 * INTERFACE SIMPLIFICADA:
 * - Chat como foco principal
 * - Upload de documentos integrado
 * - Histórico de conversas
 * - Documentos no RAG aparecem automaticamente
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Menu, X, Upload, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Streamdown } from 'streamdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ title: string; type: string }>;
  metrics?: {
    faithfulnessScore: number;
    citationCoverageScore: number;
  };
  riskClassification?: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval?: boolean;
  timestamp: Date;
}

export default function V2() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC
  const queryMutation = trpc.copilot.query.useMutation();
  const documentsQuery = trpc.documents.listApproved.useQuery();
  const uploadMutation = trpc.documents.upload.useMutation();

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar documentos
  useEffect(() => {
    if (documentsQuery.data) {
      const approvedDocs = documentsQuery.data.filter((doc: any) => doc.status === 'approved');
      setDocumentsCount(approvedDocs.length);
    }
  }, [documentsQuery.data]);

  // Enviar mensagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await queryMutation.mutateAsync({ 
        question: input,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        citations: result.citations,
        metrics: result.metrics,
        riskClassification: result.riskClassification,
        requiresApproval: result.requiresApproval,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua consulta. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload de arquivo
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validar tipo
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!validTypes.includes(file.type)) {
          console.error(`Tipo não suportado: ${file.type}`);
          continue;
        }

        // Validar tamanho
        if (file.size > 50 * 1024 * 1024) {
          console.error(`Arquivo muito grande: ${file.name}`);
          continue;
        }

        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          await uploadMutation.mutateAsync({
            title: file.name,
            documentType: 'other',
            fileBuffer: buffer,
            fileName: file.name,
            mimeType: file.type,
          });

          setUploadProgress(((i + 1) / files.length) * 100);
        } catch (err) {
          console.error('Erro ao enviar:', err);
        }
      }

      // Recarregar documentos
      await documentsQuery.refetch();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Nova conversa
  const startNewConversation = () => {
    setMessages([]);
    setInput('');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Evolumix 360° v2.0</h1>
            <p className="text-sm text-slate-400">Copiloto com IA + RAG</p>
          </div>
          <div className="flex items-center gap-4">
            {documentsCount > 0 && (
              <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-green-300 font-medium">✅ {documentsCount} docs indexados</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{user?.name || 'Usuário'}</span>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Área de Chat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-md">
                <h2 className="text-3xl font-bold text-white mb-3">Bem-vindo! 👋</h2>
                <p className="text-slate-400 mb-6">
                  Faça perguntas sobre documentos técnicos, FISPQ, segurança e obtenha recomendações baseadas em IA.
                </p>

                {documentsCount === 0 ? (
                  <div className="mb-8 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                    <div className="flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-blue-200 mb-2">Próximo passo:</p>
                        <p className="text-sm text-blue-200">
                          Clique em "Enviar Documentos" abaixo para fazer upload de FISPQ e fichas técnicas.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 p-4 rounded-lg bg-green-900/20 border border-green-500/30">
                    <div className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-green-200 mb-1">✅ Pronto para usar!</p>
                        <p className="text-sm text-green-200">
                          {documentsCount} documentos indexados. Faça sua primeira pergunta!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '🧪', text: 'Qual a composição?' },
                    { icon: '⚠️', text: 'Quais os riscos?' },
                    { icon: '💰', text: 'Calcule ROI' },
                    { icon: '📋', text: 'Recomendações' },
                  ].map((action) => (
                    <button
                      key={action.text}
                      className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-blue-500/50 transition-all text-center"
                      onClick={() => setInput(action.text)}
                    >
                      <div className="text-xl mb-1">{action.icon}</div>
                      <p className="text-xs text-slate-300">{action.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  
                  {msg.metrics && (
                    <div className="mt-2 pt-2 border-t border-slate-600/50 text-xs text-slate-400 space-y-1">
                      <p>📊 Confiabilidade: {(msg.metrics.faithfulnessScore * 100).toFixed(0)}%</p>
                      <p>📚 Cobertura: {(msg.metrics.citationCoverageScore * 100).toFixed(0)}%</p>
                    </div>
                  )}

                  {msg.riskClassification && (
                    <div className={`mt-2 pt-2 border-t border-slate-600/50 text-xs font-semibold ${
                      msg.riskClassification === 'critical' ? 'text-red-400' :
                      msg.riskClassification === 'high' ? 'text-orange-400' :
                      msg.riskClassification === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      ⚠️ Risco: {msg.riskClassification.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Chat */}
        <div className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça uma pergunta sobre os documentos..."
              disabled={isLoading}
              className="flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>

      {/* FOOTER COM BOTÕES */}
      <div className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl px-6 py-4 flex gap-3">
        <Button
          onClick={startNewConversation}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>

        <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Enviar Documentos</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={isUploading}
          />
        </label>

        {isUploading && (
          <div className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm">
            Upload: {uploadProgress.toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}
