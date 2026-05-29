import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { Streamdown } from "streamdown";

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

export default function Copilot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryMutation = trpc.copilot.query.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
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
      const result = await queryMutation.mutateAsync({ question: input });

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
      console.error('Error querying copilot:', error);
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
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Chat Técnico</h1>
          <p className="text-slate-500 mt-2">
            Consulte especialistas em higiene profissional com respostas lastreadas em documentação técnica.
          </p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-2">Nenhuma conversa iniciada</p>
                <p className="text-sm text-slate-400">Faça uma pergunta técnica para começar</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg rounded-tl-none'
                  } p-4`}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-3">
                      <Streamdown>{message.content}</Streamdown>

                      {/* Risk Classification Badge */}
                      {message.riskClassification && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <Badge
                            variant={
                              message.riskClassification === 'critical'
                                ? 'destructive'
                                : message.riskClassification === 'high'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {message.riskClassification === 'critical'
                              ? 'Crítico'
                              : message.riskClassification === 'high'
                              ? 'Alto'
                              : message.riskClassification === 'medium'
                              ? 'Médio'
                              : 'Baixo'}
                          </Badge>
                          {message.requiresApproval && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                              Requer aprovação humana
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metrics */}
                      {message.metrics && (
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-xs">
                            <p className="text-slate-500 dark:text-slate-400">Fidelidade</p>
                            <p className="font-semibold">{(message.metrics.faithfulnessScore * 100).toFixed(0)}%</p>
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-500 dark:text-slate-400">Cobertura de Citação</p>
                            <p className="font-semibold">{(message.metrics.citationCoverageScore * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      )}

                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Fontes:</p>
                          <div className="space-y-1">
                            {message.citations.map((citation, idx) => (
                              <div key={idx} className="text-xs bg-slate-200 dark:bg-slate-700 p-2 rounded">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                  Documento #{citation.documentId}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 italic">
                                  "{citation.excerpt}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}

                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg rounded-tl-none p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processando sua consulta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta técnica sobre higiene profissional..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
