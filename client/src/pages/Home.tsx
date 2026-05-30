import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, TrendingUp, ChevronDown } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-slate-950/95 backdrop-blur-md shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
              E
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Evolumix
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-300">{user?.name}</span>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-40 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Diagnóstico Evolumix 360º
                </span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Inteligência técnica e comercial integrada para consultores de higiene profissional. 
                Análise estruturada, cálculos precisos de ROI e recomendações lastreadas em documentação técnica.
              </p>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-6 text-lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Iniciar Diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
              {isAuthenticated && (
                <Link href="/diagnostics/new">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-6 text-lg"
                  >
                    Novo Diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Scroll indicator */}
            <div className="flex justify-center mt-16 animate-bounce">
              <ChevronDown className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Os Três Pilares da Metodologia
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pilar Químico */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-cyan-500 transition-all duration-300 p-8 group">
              <div className="mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Químico</h3>
              <p className="text-slate-300 leading-relaxed">
                Análise profunda de produtos químicos, composição, eficácia, compatibilidade com superfícies 
                e conformidade com normas técnicas de higiene profissional.
              </p>
            </Card>

            {/* Pilar Higiene */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500 transition-all duration-300 p-8 group">
              <div className="mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Higiene</h3>
              <p className="text-slate-300 leading-relaxed">
                Avaliação de protocolos de higiene, segurança ocupacional, conformidade regulatória 
                e implementação de padrões internacionais de limpeza profissional.
              </p>
            </Card>

            {/* Pilar ROI */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500 transition-all duration-300 p-8 group">
              <div className="mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">ROI</h3>
              <p className="text-slate-300 leading-relaxed">
                Cálculo preciso de retorno sobre investimento, economia mensal, payback, comparativo 
                antes/depois com premissas explícitas e transparentes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Funcionalidades Principais
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-400 font-bold">01</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Chat Técnico com IA</h3>
                  <p className="text-slate-400">
                    Consulte especialistas em higiene profissional com respostas lastreadas em 
                    documentação técnica oficial (FISPQs, fichas técnicas, catálogos).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold">02</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Diagnóstico Estruturado</h3>
                  <p className="text-slate-400">
                    Formulário intuitivo que captura cenário do cliente e gera análise profunda 
                    nos três pilares com recomendações personalizadas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold">03</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Calculadora de ROI</h3>
                  <p className="text-slate-400">
                    Cálculos transparentes de economia, payback e comparativo antes/depois 
                    com premissas explícitas para apresentação ao cliente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-400 font-bold">04</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Gestão de Documentos</h3>
                  <p className="text-slate-400">
                    Upload seguro e versionado de FISPQs e fichas técnicas com aprovação 
                    humana e URLs persistentes para rastreabilidade.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold">05</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Aprovações Humanas</h3>
                  <p className="text-slate-400">
                    Fluxo obrigatório de aprovação para respostas críticas, garantindo 
                    conformidade e responsabilidade técnica.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold">06</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Dashboard de Auditoria</h3>
                  <p className="text-slate-400">
                    Histórico completo de consultas, documentos usados, métricas de qualidade 
                    e logs de aprovação para conformidade total.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 backdrop-blur">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para transformar sua consultoria?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Comece agora com o Diagnóstico Evolumix 360º e ofereça soluções técnicas 
            de alto nível com confiança e rastreabilidade completa.
          </p>
          {!isAuthenticated && (
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-6 text-lg"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
          {isAuthenticated && (
            <Link href="/diagnostics/new">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-6 text-lg"
              >
                Novo Diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-6xl mx-auto text-center text-slate-400 text-sm">
          <p>© 2026 Evolumix. Diagnóstico Técnico-Comercial para Higiene Profissional.</p>
        </div>
      </footer>
    </div>
  );
}
