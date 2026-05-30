import { useAuth } from "@/_core/hooks/useAuth";
import OperationalLayout from "@/components/OperationalLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle, CheckCircle, FileText, LogOut } from "lucide-react";
import { Streamdown } from "streamdown";
import { Link } from "wouter";

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

interface DiagnosticData {
  area?: string;
  fluxoPessoas?: string;
  produtosAtuais?: string;
  consumoMensal?: number;
  custoMensal?: number;
}

export default function ChatOperational() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({});
  const [roiData, setRoiData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryMutation = trpc.copilot.query.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
  };

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

      // Dados serão extraídos naturalmente durante a conversa

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

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  const chatSection = (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  Bem-vindo ao Evolumix 360º
                </h3>
                <p className="text-slate-400 mb-4">
                  Comece fazendo uma pergunta sobre higiene, produtos ou ROI
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="space-y-3">
                    <Streamdown>{message.content}</Streamdown>

                    {/* Metrics */}
                    {message.metrics && (
                      <div className="pt-2 border-t border-slate-700 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Confiabilidade:</span>
                          <span className="text-slate-300">
                            {(message.metrics.faithfulnessScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Citações:</span>
                          <span className="text-slate-300">
                            {(message.metrics.citationCoverageScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Risk Badge */}
                    {message.riskClassification && (
                      <Badge className={`text-xs ${getRiskColor(message.riskClassification)}`}>
                        Risco: {message.riskClassification}
                      </Badge>
                    )}

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-700 space-y-1">
                        <p className="text-xs text-slate-400 font-semibold">Fontes:</p>
                        {message.citations.map((citation, idx) => (
                          <div key={idx} className="text-xs text-slate-300 flex gap-2">
                            <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{citation.source}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-100 px-4 py-3 rounded-lg rounded-bl-none border border-slate-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-slate-700/50 bg-slate-900/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta..."
            className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  const sidebarSection = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400">Usuário</p>
          <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-400 hover:text-slate-200"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Diagnostic Data */}
          {Object.keys(diagnosticData).length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700 p-3">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Dados Coletados</h4>
              <div className="space-y-1 text-xs">
                {diagnosticData.area && (
                  <div>
                    <span className="text-slate-400">Área:</span>
                    <span className="text-slate-200 ml-2">{diagnosticData.area}</span>
                  </div>
                )}
                {diagnosticData.fluxoPessoas && (
                  <div>
                    <span className="text-slate-400">Fluxo:</span>
                    <span className="text-slate-200 ml-2">{diagnosticData.fluxoPessoas}</span>
                  </div>
                )}
                {diagnosticData.consumoMensal && (
                  <div>
                    <span className="text-slate-400">Consumo:</span>
                    <span className="text-slate-200 ml-2">{diagnosticData.consumoMensal}L/mês</span>
                  </div>
                )}
                {diagnosticData.custoMensal && (
                  <div>
                    <span className="text-slate-400">Custo:</span>
                    <span className="text-slate-200 ml-2">R$ {diagnosticData.custoMensal}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ROI Data */}
          {roiData && (
            <Card className="bg-slate-800/50 border-slate-700 p-3">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Análise ROI</h4>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-400">Economia Mensal:</span>
                  <span className="text-green-400 ml-2 font-semibold">
                    R$ {roiData.economiaMenual?.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Payback:</span>
                  <span className="text-slate-200 ml-2">{roiData.payback} meses</span>
                </div>
                <div>
                  <span className="text-slate-400">Economia Anual:</span>
                  <span className="text-green-400 ml-2 font-semibold">
                    R$ {roiData.economiaAnual?.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-slate-800/50 border-slate-700 p-3">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Ações Rápidas</h4>
            <div className="space-y-2">
              <Link href="/documents">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Documentos
                </Button>
              </Link>
              <Link href="/approvals">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Aprovações
                </Button>
              </Link>
              <Link href="/audit">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Auditoria
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <OperationalLayout
      chatSection={chatSection}
      sidebarSection={sidebarSection}
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
              E
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Evolumix 360º
            </span>
          </div>
          <span className="text-sm text-slate-400">Copiloto Técnico</span>
        </div>
      }
    />
  );
}
