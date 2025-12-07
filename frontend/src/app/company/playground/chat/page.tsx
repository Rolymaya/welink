'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CompanyLayout from '@/components/company-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Trash2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

function ChatContent() {
    const searchParams = useSearchParams();
    const agentId = searchParams?.get('agentId');

    const [agents, setAgents] = useState<any[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [limits, setLimits] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadAgents();
        loadLimits();
    }, []);

    useEffect(() => {
        if (agentId && agents.length > 0) {
            const agent = agents.find(a => a.id === agentId);
            if (agent) {
                handleSelectAgent(agent);
            }
        }
    }, [agentId, agents]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function loadAgents() {
        try {
            const res = await api.get('/playground/agents');
            setAgents(res.data);
        } catch (error) {
            console.error('Error loading agents:', error);
            toast.error('Erro ao carregar agentes');
        }
    }

    async function loadLimits() {
        try {
            const res = await api.get('/playground/limits');
            setLimits(res.data);
        } catch (error) {
            console.error('Error loading limits:', error);
        }
    }

    async function handleSelectAgent(agent: any) {
        setSelectedAgent(agent);
        setMessages([]);
        setSession(null);

        try {
            const res = await api.post('/playground/sessions', { agentId: agent.id });
            setSession(res.data);
        } catch (error) {
            console.error('Error creating session:', error);
            toast.error('Erro ao criar sessão');
        }
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || !session || sending) return;

        const userMessage = input.trim();
        setInput('');
        setSending(true);

        // Add user message optimistically
        setMessages(prev => [...prev, { sender: 'user', content: userMessage, createdAt: new Date() }]);

        try {
            const res = await api.post('/playground/messages', {
                sessionId: session.id,
                content: userMessage,
            });

            // Add agent response
            setMessages(prev => [...prev, res.data]);
            await loadLimits(); // Update limits
        } catch (error: any) {
            console.error('Error sending message:', error);
            toast.error(error.response?.data?.message || 'Erro ao enviar mensagem');
            // Remove optimistic message on error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setSending(false);
        }
    }

    async function handleClearSession() {
        if (!session) return;
        if (!confirm('Limpar toda a conversa?')) return;

        try {
            await api.delete(`/playground/sessions/${session.id}`);
            setMessages([]);

            // Create new session
            const res = await api.post('/playground/sessions', { agentId: selectedAgent.id });
            setSession(res.data);
            toast.success('Conversa limpa!');
        } catch (error) {
            console.error('Error clearing session:', error);
            toast.error('Erro ao limpar conversa');
        }
    }

    return (
        <CompanyLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <FlaskConical className="h-8 w-8 text-primary" />
                            Chat de Teste
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Teste seus agentes em tempo real
                        </p>
                    </div>
                    {session && (
                        <Button variant="outline" size="sm" onClick={handleClearSession}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Limpar Conversa
                        </Button>
                    )}
                </div>

                {limits && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="py-3">
                            <p className="text-sm text-blue-900">
                                Mensagens hoje: <span className="font-bold">{limits.messages.used}/{limits.messages.limit}</span>
                                {' '}({limits.messages.remaining} restantes)
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="flex-1 grid grid-cols-4 gap-4">
                    {/* Agent Selector */}
                    <Card className="col-span-1">
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-3">Selecione um Agente</h3>
                            <div className="space-y-2">
                                {agents.map(agent => (
                                    <button
                                        key={agent.id}
                                        onClick={() => handleSelectAgent(agent)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedAgent?.id === agent.id
                                            ? 'bg-primary text-white border-primary'
                                            : 'hover:bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <p className="font-medium text-sm">{agent.name}</p>
                                        {agent.description && (
                                            <p className="text-xs opacity-75 mt-1">{agent.description}</p>
                                        )}
                                    </button>
                                ))}
                                {agents.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Nenhum agente criado ainda
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chat Area */}
                    <Card className="col-span-3 flex flex-col">
                        <CardContent className="flex-1 flex flex-col p-0">
                            {!selectedAgent ? (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <FlaskConical className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p>Selecione um agente para começar</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages.length === 0 && (
                                            <div className="text-center text-gray-500 py-8">
                                                <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                                            </div>
                                        )}
                                        {messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender === 'user'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-900'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {sending && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 rounded-lg px-4 py-2">
                                                    <p className="text-sm text-gray-500">Digitando...</p>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="border-t p-4">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <Input
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Digite sua mensagem..."
                                                disabled={sending || !session}
                                            />
                                            <Button type="submit" disabled={sending || !session || !input.trim()}>
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </CompanyLayout>
    );
}

export default function PlaygroundChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <ChatContent />
        </Suspense>
    );
}
