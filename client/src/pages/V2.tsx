/**
 * V2.tsx - Plataforma de Trabalho v2.0
 * 
 * Arquitetura:
 * - Sidebar esquerda: Navegação + histórico
 * - Chat principal: Foco na conversa
 * - Dark mode: Profissional e moderno
 * - Responsivo: Mobile-first
 * 
 * Funcionalidades:
 * - Chat com IA + RAG
 * - Upload de documentos
 * - Histórico de conversas
 * - Diagnósticos rápidos
 * - Exportação de resultados
 */

import { useState } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { AIChatBox } from '../components/AIChatBox';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Plus, Menu, X, Upload, FileText, History, Settings, LogOut, MessageSquare } from 'lucide-react';

export default function V2() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; date: string }>>([
    { id: '1', title: 'Análise de Risco Químico', date: 'Hoje' },
    { id: '2', title: 'Diagnóstico ROI', date: 'Ontem' },
    { id: '3', title: 'Recomendações Técnicas', date: '2 dias atrás' },
  ]);

  if (!user) return null;

  const handleSendMessage = (content: string) => {
    setMessages([...messages, { role: 'user', content }]);
    setIsLoading(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Análise baseada em documentos técnicos e dados de segurança. Recomendações: 1) Implementar controles de ventilação, 2) Treinar equipe, 3) Monitorar continuamente.' 
      }]);
      setIsLoading(false);
    }, 1500);
  };

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

        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-700/50">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Histórico</p>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
            >
              <p className="text-sm text-slate-300 group-hover:text-white truncate">{conv.title}</p>
              <p className="text-xs text-slate-500">{conv.date}</p>
            </button>
          ))}
        </div>

        {/* Bottom Menu */}
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

      {/* Main Content */}
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            // Empty State
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
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <p className="text-sm text-slate-300">{action.text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat Messages
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
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
            </div>
          )}

          {/* Chat Input */}
          <div className="border-t border-slate-700/50 bg-slate-900/50 p-4">
            <div className="max-w-4xl mx-auto">
              <AIChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Digite sua pergunta sobre documentos técnicos..."
                height={120}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
