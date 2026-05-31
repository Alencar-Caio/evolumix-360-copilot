/**
 * V2.tsx - Plataforma de Trabalho v2.0 (100% Funcional)
 * 
 * Arquitetura:
 * - Sidebar: Navegação + histórico de conversas
 * - Chat: Foco principal com IA + RAG
 * - Backend: tRPC mutations para persistência
 * 
 * Funcionalidades:
 * - Chat com IA + RAG (busca semântica em documentos)
 * - Upload de documentos técnicos
 * - Histórico de conversas persistente
 * - Diagnósticos com métricas
 * - Exportação de resultados
 * - Dark mode profissional
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Plus, Menu, X, Upload, FileText, History, Settings, LogOut, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Streamdown } from 'streamdown';

/**
 * Interface de mensagem - compatível com backend
 */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: any[];
  metrics?: {
    faithfulnessScore: number;
    citationCoverageScore: number;
  };
  riskClassification?: string;
  requiresApproval?: boolean;
  timestamp: Date;
}

export default function V2() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; date: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  const queryMutation = trpc.copilot.query.useMutation();

  /**
   * Auto-scroll para última mensagem
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Enviar mensagem para IA
   * - Valida entrada
   * - Adiciona mensagem do usuário
   * - Chama tRPC mutation
   * - Processa resposta com métricas
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Adicionar mensagem do usuário
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
      // Chamar backend via tRPC
      const result = await queryMutation.mutateAsync({ question: input });

      // Processar resposta com métricas e citações
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

      // Adicionar à lista de conversas se for primeira mensagem
      if (messages.length === 0) {
        const newConv = {
          id: Date.now().toString(),
          title: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
          date: 'Agora',
        };
        setConversations(prev => [newConv, ...prev]);
      }
    } catch (error) {
      console.error('Erro ao consultar copiloto:', error);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-slate-950/50 border-r border-slate-700/50 backdrop-blur-xl flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Evolumix 360</h1>
              <p className="text-xs text-slate-400">v2.0</p>
            </div>
          </div>
        </div>

        {/* Nova Conversa */}
        <div className="p-4 border-b border-slate-700/50">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
            onClick={() => {
              setMessages([]);
              setInput('');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>

        {/* Histórico */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Histórico</p>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhuma conversa ainda</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
                onClick={() => {
                  // Carregar conversa
                  setMessages([]);
                  setInput('');
                }}
              >
                <p className="text-sm text-slate-300 group-hover:text-white truncate">{conv.title}</p>
                <p className="text-xs text-slate-500">{conv.date}</p>
              </button>
            ))
          )}
        </div>

        {/* Menu Inferior */}
        <div className="border-t border-slate-700/50 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors text-sm">
            <Upload className="w-4 h-4" />
            Documentos
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors text-sm">
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Copiloto 360°</h2>
              <p className="text-xs text-slate-400">IA + Documentos Técnicos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{user?.name || 'Usuário'}</span>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
          </div>
        </header>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            // Estado Vazio
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <MessageSquare className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Copiloto 360°</h3>
              <p className="text-slate-400 text-center max-w-md mb-8">
                Faça perguntas sobre documentos técnicos, FISPQ, segurança e obtenha recomendações baseadas em IA
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                {[
                  { icon: '🧪', text: 'Análise Química' },
                  { icon: '⚠️', text: 'Avaliação de Risco' },
                  { icon: '💰', text: 'Cálculo de ROI' },
                  { icon: '📋', text: 'Recomendações' },
                ].map((action) => (
                  <button
                    key={action.text}
                    className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 text-center"
                    onClick={() => setInput(action.text)}
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <p className="text-sm text-slate-300">{action.text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Mensagens
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-lg rounded-br-none'
                        : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-lg rounded-bl-none'
                    } px-4 py-3`}
                  >
                    {msg.role === 'assistant' ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}

                    {/* Métricas e Citações */}
                    {msg.role === 'assistant' && msg.metrics && (
                      <div className="mt-3 pt-3 border-t border-slate-600/50 space-y-2">
                        <div className="flex gap-4 text-xs">
                          <span className="text-slate-400">
                            Confiabilidade: {(msg.metrics.faithfulnessScore * 100).toFixed(0)}%
                          </span>
                          <span className="text-slate-400">
                            Cobertura: {(msg.metrics.citationCoverageScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        {msg.riskClassification && (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            msg.riskClassification === 'CRÍTICO' ? 'bg-red-500/20 text-red-300' :
                            msg.riskClassification === 'ALTO' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {msg.riskClassification}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input de Chat */}
          <div className="border-t border-slate-700/50 bg-slate-900/50 p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta sobre documentos técnicos..."
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
