'use client';
import { buildApiUrl } from '@/lib/apiUrl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bot, MessageSquare, Database, Zap, Shield, Users,
  CheckCircle2, ArrowRight, Star, Phone, Mail, MapPin,
  Sparkles, TrendingUp, Clock, BarChart3, Calendar, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxAgents: number;
  maxSessions: number;
  maxContacts: number;
  allowAudioResponse: boolean;
  allowScheduling: boolean;
  isActive: boolean;
}

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(buildApiUrl('/packages/public'));
      if (response.ok) {
        const data = await response.json();
        // Filter only active packages and sort by price
        const activePackages = data
          .filter((pkg: Package) => pkg.isActive)
          .sort((a: Package, b: Package) => a.price - b.price);
        setPackages(activePackages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-gray-950/95 shadow-sm">
        <div className="container mx-auto px-8 md:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WeLinkAI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#hero" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Início
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Como Usar?
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Preços
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Contacto
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero"></section>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Powered by Advanced AI
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Automatize o Atendimento
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                com Inteligência Artificial
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Crie agentes de IA que respondem automaticamente no WhatsApp, aprendem com sua base de conhecimento e atendem seus clientes 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 h-14 shadow-lg shadow-blue-500/50">
                  Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Ver Preços
                </Button>
              </a>
            </div>
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Sem cartão de crédito
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Teste grátis 14 dias
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Suporte em português
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-950 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                10k+
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Mensagens/dia</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                99.9%
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                24/7
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Disponibilidade</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                &lt;1s
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Tempo de resposta</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo que Precisa para
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Automatizar</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Funcionalidades poderosas para transformar o atendimento da sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: MessageSquare,
                title: 'WhatsApp Integrado',
                description: 'Conecte múltiplas contas WhatsApp e gerencie todas as conversas em um só lugar.',
                color: 'from-green-500 to-emerald-600'
              },
              {
                icon: Database,
                title: 'Base de Conhecimento',
                description: 'Carregue documentos, PDFs e URLs. A IA aprende automaticamente com seu conteúdo.',
                color: 'from-blue-500 to-cyan-600'
              },
              {
                icon: Bot,
                title: 'Agentes Inteligentes',
                description: 'Crie múltiplos agentes com personalidades e conhecimentos específicos.',
                color: 'from-purple-500 to-pink-600'
              },
              {
                icon: Calendar,
                title: 'Agendamentos',
                description: 'Permita que clientes agendem compromissos diretamente pelo WhatsApp.',
                color: 'from-orange-500 to-red-600'
              },
              {
                icon: BarChart3,
                title: 'Analytics Avançado',
                description: 'Acompanhe métricas, conversas e performance dos seus agentes em tempo real.',
                color: 'from-indigo-500 to-purple-600'
              },
              {
                icon: Shield,
                title: 'Segurança Total',
                description: 'Dados criptografados, backup automático e conformidade com LGPD.',
                color: 'from-gray-700 to-gray-900'
              }
            ].map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-xl group">
                <CardContent className="pt-6 space-y-4">
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Funciona</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Em apenas 3 passos simples, seu agente de IA estará pronto
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Crie seu Agente',
                description: 'Configure a personalidade, tom de voz e instruções específicas para seu agente de IA.',
                icon: Bot
              },
              {
                step: '02',
                title: 'Adicione Conhecimento',
                description: 'Carregue documentos, links e informações que seu agente deve conhecer.',
                icon: Database
              },
              {
                step: '03',
                title: 'Conecte ao WhatsApp',
                description: 'Escaneie o QR code e comece a atender clientes automaticamente.',
                icon: MessageSquare
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute -top-4 -right-4 text-7xl font-bold text-blue-100 dark:text-blue-900/30">
                      {item.step}
                    </div>
                    <div className="relative h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
                      <item.icon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-8 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8 lg:pl-20">
              <h2 className="text-4xl font-bold leading-tight">
                Gerencie tudo em um <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Painel Intuitivo
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Acompanhe métricas em tempo real, gerencie conversas e treine seu agente de IA, tudo em um único lugar.
              </p>
              <ul className="space-y-4">
                {[
                  'Analytics detalhado de conversas',
                  'Gestão de base de conhecimento',
                  'Histórico completo de atendimentos',
                  'Configurações avançadas de IA'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 h-12">
                  Ver Demonstração
                </Button>
              </Link>
            </div>
            <div className="lg:w-1/2 relative flex justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 blur-2xl animate-pulse w-[80%] mx-auto"></div>
              <img
                src="/dashboard-preview.png"
                alt="WeLinkAI Dashboard"
                className="relative rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[85%] mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Planos para <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Todos</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Escolha o plano ideal para o tamanho da sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {loading ? (
              <div className="col-span-3 text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">A carregar pacotes...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Nenhum pacote disponível no momento.</p>
              </div>
            ) : (
              packages.slice(0, 3).map((pkg, index) => {
                const gradients = [
                  'from-blue-500 to-cyan-500',
                  'from-purple-500 to-pink-500',
                  'from-orange-500 to-red-500'
                ];
                const gradient = gradients[index % gradients.length];
                const isPopular = index === 1 && packages.length >= 3; // Middle package is popular

                const features = [
                  `${pkg.maxAgents} ${pkg.maxAgents === 1 ? 'Agente' : 'Agentes'} de IA`,
                  `${pkg.maxSessions} ${pkg.maxSessions === 1 ? 'Sessão' : 'Sessões'} WhatsApp`,
                  `${pkg.maxContacts.toLocaleString()} Contactos`,
                  'Base de conhecimento',
                  ...(pkg.allowScheduling ? ['Agendamentos'] : []),
                  ...(pkg.allowAudioResponse ? ['Respostas em áudio'] : []),
                  'Suporte técnico'
                ];

                const borderColors = [
                  'border-blue-500',
                  'border-purple-500',
                  'border-orange-500'
                ];
                const borderColor = borderColors[index % borderColors.length];

                return (
                  <Card key={pkg.id} className={`relative border-4 ${borderColor} ${isPopular ? 'shadow-2xl scale-105' : ''} hover:shadow-xl transition-all duration-300`}>
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                          MAIS POPULAR
                        </div>
                      </div>
                    )}
                    <CardContent className="pt-8 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{pkg.description}</p>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-5xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                            {new Intl.NumberFormat('pt-AO').format(pkg.price)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">Kz</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">por {pkg.durationDays} dias</p>
                      </div>
                      <ul className="space-y-3">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 bg-gradient-to-r ${gradient} text-white rounded-full`} />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/auth/register">
                        <Button className={`w-full h-12 text-lg bg-gradient-to-r ${gradient} hover:opacity-90`}>
                          Começar Agora
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* View All Packages Button */}
          {!loading && packages.length > 3 && (
            <div className="text-center mt-12">
              <Link href="/packages">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Ver Todos os Pacotes ({packages.length}) <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que Dizem Nossos <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Clientes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'João Silva',
                role: 'CEO, TechStart',
                content: 'Reduziu nosso tempo de resposta em 80%. Os clientes adoram o atendimento instantâneo!',
                rating: 5
              },
              {
                name: 'Maria Santos',
                role: 'Gerente de Vendas, ComércioPlus',
                content: 'Conseguimos atender 3x mais clientes com a mesma equipe. ROI incrível!',
                rating: 5
              },
              {
                name: 'Pedro Costa',
                role: 'Diretor, ServiçoPro',
                content: 'A integração com WhatsApp foi perfeita. Implementação rápida e suporte excelente.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="pt-4 border-t">
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Perguntas <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Frequentes</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: 'Como funciona o período de teste?',
                answer: 'Você tem 14 dias para testar todas as funcionalidades gratuitamente, sem precisar cadastrar cartão de crédito.'
              },
              {
                question: 'Posso mudar de plano depois?',
                answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.'
              },
              {
                question: 'Quantas mensagens posso enviar?',
                answer: 'Não há limite de mensagens. Você paga apenas pelo plano mensal escolhido.'
              },
              {
                question: 'Os dados são seguros?',
                answer: 'Sim, usamos criptografia de ponta a ponta e nossos servidores são certificados e em conformidade com a LGPD.'
              },
              {
                question: 'Preciso de conhecimentos técnicos?',
                answer: 'Não! Nossa plataforma é intuitiva e não requer conhecimentos técnicos. Oferecemos tutoriais e suporte completo.'
              }
            ].map((faq, index) => (
              <div key={index} className="border-2 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <ArrowRight className={`h-5 w-5 transition-transform ${activeFaq === index ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === index && (
                  <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Entre em <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Contacto</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Estamos aqui para ajudar. Fale connosco!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-center">
              <CardContent className="pt-8 space-y-4">
                <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Phone className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Telefone</h3>
                <p className="text-gray-600 dark:text-gray-400">+244 945 571 528</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-all text-center">
              <CardContent className="pt-8 space-y-4">
                <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Email</h3>
                <p className="text-gray-600 dark:text-gray-400">nos@wenova.ao</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-all text-center">
              <CardContent className="pt-8 space-y-4">
                <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Localização</h3>
                <p className="text-gray-600 dark:text-gray-400">Luanda, Angola</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Pronto para Revolucionar seu Atendimento?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Junte-se a centenas de empresas que já automatizaram seu atendimento com IA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="text-lg px-8 h-14 shadow-xl">
                  Começar Teste Grátis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-white/10 hover:bg-white/20 text-white border-white/30">
                  Ver Planos
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-8 md:px-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">WeLinkAI</span>
              </div>
              <p className="text-sm text-gray-400">
                Automatize o atendimento da sua empresa com inteligência artificial.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Começar Grátis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 WeLinkAI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
