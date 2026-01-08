"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, MessageCircle, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Lead {
    session_id: string;
    name: string;
    phone: string;
    last_message: string;
    last_time: string;
    agent_paused: boolean;
    urgent?: boolean;
    unread?: number;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export default function KanbanPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [msgInput, setMsgInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'todos' | 'urgentes'>('todos');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const selectedLead = leads.find(l => l.session_id === selectedLeadId);

    // Helper to check if content is an orchestrator routing message (should be hidden)
    const isRoutingMessage = (content: any): boolean => {
        if (!content) return false;

        // Convert to string for pattern matching
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const lower = contentStr.toLowerCase();

        // Exact patterns for orchestrator routing messages
        const routingPatterns = [
            '"route"',
            '"output"',
            '"reason"',
            'routing to',
            'route to kit',
            'route to normal',
            'agente comum',
            'kit agent',
            '"route":"kit"',
            '"route":"normal"',
            '"route": "kit"',
            '"route": "normal"',
            '{"output":',
            '{ "output":',
            '"output": {',
            '"output":{',
        ];

        for (const pattern of routingPatterns) {
            if (lower.includes(pattern)) {
                return true;
            }
        }

        // Check if it's an object with routing properties
        if (typeof content === 'object' && content !== null) {
            if (content.route || content.output || content.reason) {
                return true;
            }
            // Check nested output object
            if (content.output && (content.output.route || content.output.reason)) {
                return true;
            }
        }

        // Check if the entire message is just a short routing response
        const trimmed = contentStr.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}') && trimmed.length < 100) {
            // Short JSON that might be routing
            if (lower.includes('route') || lower.includes('output')) {
                return true;
            }
        }

        return false;
    };

    // Helper to clean message content
    const cleanMessage = (content: any): string => {
        if (!content) return "";

        // Filter out orchestrator routing messages
        if (isRoutingMessage(content)) {
            return ""; // Return empty to hide this message
        }

        // 1. If it's an object (JSONB)
        if (typeof content === 'object') {
            // Check for routing patterns in object
            if (content.route || content.output?.route) {
                return ""; // Hide routing messages
            }
            return content.content || content.message || content.text || "";
        }

        // 2. If it's a string
        let cleaned = String(content).trim();

        // Remove wrapping quotes if present
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }

        // Check if it's a JSON string
        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
            try {
                const parsed = JSON.parse(cleaned);

                // Check if parsed JSON is a routing message
                if (isRoutingMessage(parsed)) {
                    return ""; // Hide routing messages
                }

                // Recursively clean the parsed object
                return cleanMessage(parsed);
            } catch (e) {
                // Not a valid JSON, check if it still contains routing patterns
                if (isRoutingMessage(cleaned)) {
                    return "";
                }
            }
        }

        // Final check for routing patterns in plain text
        if (isRoutingMessage(cleaned)) {
            return "";
        }

        return cleaned;
    };

    // Helper to map DB role/type to UI role
    const getRole = (msg: any): 'user' | 'assistant' => {
        // 1. Check explicit 'role' column
        if (msg.role === 'user' || msg.role === 'assistant') return msg.role;

        // 2. Check inside the 'message' column
        let msgObj = msg.message;

        // If 'message' is string, try to parse it to check type
        if (typeof msgObj === 'string' && msgObj.startsWith('{')) {
            try {
                msgObj = JSON.parse(msgObj);
            } catch (e) { }
        }

        if (typeof msgObj === 'object' && msgObj !== null) {
            if (msgObj.type === 'human') return 'user';
            if (msgObj.type === 'ai') return 'assistant';
        }

        return 'user';
    }

    // Handle lead selection - also switch to chat view on mobile
    const handleSelectLead = (sessionId: string) => {
        setSelectedLeadId(sessionId);
        setMobileView('chat');
    };

    // Handle back to list on mobile
    const handleBackToList = () => {
        setMobileView('list');
    };

    // 1. Fetch Leads - Using dados_cliente as primary source
    const fetchLeads = useCallback(async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            // Mock Fallback
            setLeads([
                { session_id: "5521999991234", name: "João (Mock)", phone: "5521999991234", last_message: "Pode ser.", last_time: "00:49", agent_paused: false, unread: 2 },
                { session_id: "5521988885678", name: "Maria Oliveira", phone: "5521988885678", last_message: "Qual o valor da picanha?", last_time: "00:30", agent_paused: true },
            ]);
            setLoading(false);
            return;
        }

        try {
            // Fetch clients from dados_cliente (PRIMARY SOURCE)
            const { data: clients, error } = await supabase
                .from('dados_cliente')
                .select('*')
                .not('sessionid', 'is', null)
                .order('id', { ascending: false });

            if (error || !clients) throw error;

            console.log('[FetchLeads] Fetched clients from dados_cliente:', clients.length);

            const leadsWithDetails = await Promise.all(clients.map(async (client) => {
                // Get last message from medx34_history
                const { data: msgs } = await supabase
                    .from('medx34_history')
                    .select('message, id')
                    .eq('session_id', client.sessionid)
                    .order('id', { ascending: false })
                    .limit(1);

                const lastMsgRow = msgs?.[0];
                const rawContent = lastMsgRow?.message;

                // Determine paused state directly from dados_cliente.atendimento
                const isPaused = client.atendimento === 'human';

                return {
                    session_id: client.sessionid,
                    name: client.nome || `Cliente ${client.sessionid?.slice(-4) || '????'}`,
                    phone: client.telefone || client.sessionid,
                    last_message: cleanMessage(rawContent) || "Iniciar conversa",
                    last_time: "",
                    agent_paused: isPaused,
                    urgent: client.urgente === true || client.urgente === 'true',
                    unread: 0
                };
            }));

            setLeads(leadsWithDetails);
            if (leadsWithDetails.length > 0 && !selectedLeadId) {
                setSelectedLeadId(leadsWithDetails[0].session_id);
            }

            console.log('[FetchLeads] Loaded', leadsWithDetails.length, 'leads from dados_cliente');

        } catch (e) {
            console.error("Error fetching leads:", e);
        } finally {
            setLoading(false);
        }
    }, [selectedLeadId]);

    // Initial fetch
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Realtime subscription for dados_cliente changes
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const channel = supabase
            .channel('dados_cliente_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'dados_cliente'
                },
                (payload) => {
                    console.log('[Realtime] dados_cliente changed:', payload.eventType);
                    // Silently refresh leads when data changes
                    fetchLeads();
                }
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Subscription status:', status);
                if (err) console.error('[Realtime] Subscription error:', err);
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] ✅ Connected! Listening for changes on dados_cliente');
                }
            });

        // Cleanup on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchLeads]);

    // 2. Fetch Messages for Selected Lead
    useEffect(() => {
        if (!selectedLeadId) return;
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        async function fetchHistory() {
            const { data, error } = await supabase
                .from('medx34_history')
                .select('*')
                .eq('session_id', selectedLeadId)
                .order('id', { ascending: true });

            if (!error && data) {
                const normalized = data.map((msg: any) => ({
                    id: msg.id.toString(),
                    role: getRole(msg),
                    content: cleanMessage(msg.message),
                    created_at: msg.created_at || new Date().toISOString()
                }));
                setMessages(normalized);
            }
        }

        fetchHistory();

        // Realtime subscription
        const channel = supabase
            .channel('chat-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'medx34_history', filter: `session_id=eq.${selectedLeadId}` }, (payload) => {
                const newMsgRaw = payload.new as any;
                const newMsg: Message = {
                    id: newMsgRaw.id.toString(),
                    role: getRole(newMsgRaw),
                    content: cleanMessage(newMsgRaw.message),
                    created_at: newMsgRaw.created_at || new Date().toISOString()
                };

                // Verificar se já existe uma mensagem com o mesmo conteúdo recente (últimos 10 segundos)
                // Isso evita duplicação quando a mensagem otimista já foi adicionada
                setMessages(prev => {
                    const isDuplicate = prev.some(msg => {
                        const isSameContent = msg.content === newMsg.content;
                        const timeDiff = Math.abs(
                            new Date(msg.created_at).getTime() - new Date(newMsg.created_at).getTime()
                        );
                        // Considera duplicata se conteúdo igual e timestamp dentro de 10s
                        return isSameContent && timeDiff < 10000;
                    });

                    if (isDuplicate) {
                        console.log('[Realtime] Mensagem duplicada detectada, ignorando:', newMsg.content.substring(0, 50));
                        return prev; // Não adiciona
                    }

                    console.log('[Realtime] Nova mensagem recebida:', newMsg.content.substring(0, 50));
                    return [...prev, newMsg];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }

    }, [selectedLeadId]);

    // 3. Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const togglePause = async (id: string, current: boolean) => {
        if (!id) {
            console.error('[TogglePause] Cannot update: session_id is null or undefined');
            return;
        }

        // Optimistic update
        setLeads(leads.map(l => l.session_id === id ? { ...l, agent_paused: !current } : l));

        const newStatus = !current ? 'human' : 'ia';
        const lead = leads.find(l => l.session_id === id);

        console.log('[TogglePause] Sending to webhook - session:', id, 'status:', newStatus);

        // Call Webhook - n8n will handle the database update
        try {
            const response = await fetch('https://webhook.riobutcher.cloud/webhook/d093367f-1bdb-48c0-a859-378aba603e79', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: id,
                    cliente_nome: lead?.name || '',
                    telefone: lead?.phone || '',
                    atendimento: newStatus,
                    action: !current ? 'pause' : 'resume',
                    timestamp: new Date().toISOString()
                })
            });

            // Handle response safely (might be empty or non-JSON)
            const responseText = await response.text();
            console.log('[TogglePause] Webhook raw response:', responseText);

            if (responseText) {
                try {
                    const data = JSON.parse(responseText);
                    console.log('[TogglePause] Webhook parsed response:', data);

                    if (data.client_id) {
                        console.log('[TogglePause] Client ID from n8n:', data.client_id);
                    }
                } catch (parseError) {
                    console.log('[TogglePause] Response is not JSON, that is OK');
                }
            }
        } catch (error) {
            console.error('[TogglePause] Error calling webhook:', error);
        }
    };

    // Delete Lead Function
    const deleteLead = async () => {
        if (!selectedLeadId || !selectedLead) return;

        setDeleteLoading(true);

        try {
            const response = await fetch('https://webhook.riobutcher.cloud/webhook/1e798b10-12b1-4767-8169-eadbc278b77c', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedLeadId,
                    cliente_nome: selectedLead.name,
                    telefone: selectedLead.phone,
                    action: 'delete'
                })
            });

            if (response.ok) {
                // Remove lead from local state
                setLeads(prev => prev.filter(l => l.session_id !== selectedLeadId));
                setSelectedLeadId(null);
                setMessages([]);
                setMobileView('list');
                console.log('[DeleteLead] Lead deleted successfully');
            }
        } catch (error) {
            console.error('[DeleteLead] Error:', error);
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const sendMessage = async () => {
        if (!msgInput.trim() || !selectedLeadId) return;

        const messageContent = msgInput.trim();

        // Optimistic UI update
        const newMsgMock: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: messageContent,
            created_at: new Date().toISOString()
        };
        setMessages([...messages, newMsgMock]);
        setMsgInput("");

        // Call Send Message Webhook
        try {
            await fetch('https://webhook.riobutcher.cloud/webhook/6489800a-f2b7-40e3-bd71-76d77ea140b3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedLeadId,
                    cliente_nome: selectedLead?.name || '',
                    message: messageContent,
                    sender: 'human_agent',
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error sending message via webhook:', error);
        }
    };

    return (
        <>
            <div className="flex bg-white h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                {/* Left Sidebar: List - Hidden on mobile when viewing chat */}
                <div className={cn(
                    "w-full lg:w-80 border-r border-gray-200 flex flex-col bg-white",
                    mobileView === 'chat' ? "hidden lg:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-gray-100 space-y-4">
                        <h2 className="font-semibold text-lg text-gray-800">Conversas</h2>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input placeholder="Buscar por nome ou telefone..." className="pl-8 bg-gray-50 border-gray-200" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-lg px-3",
                                    activeTab === 'todos'
                                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                )}
                                onClick={() => setActiveTab('todos')}
                            >
                                Todos
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-lg px-3 relative",
                                    activeTab === 'urgentes'
                                        ? "bg-red-100 hover:bg-red-200 text-red-700"
                                        : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                                )}
                                onClick={() => setActiveTab('urgentes')}
                            >
                                Urgentes
                                {leads.filter(l => l.urgent).length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                        {leads.filter(l => l.urgent).length}
                                    </span>
                                )}
                            </Button>

                            <div className="ml-auto" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-[#16697A] hover:bg-[#16697A]/10 rounded-full"
                                onClick={fetchLeads}
                                title="Atualizar Lista"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {leads
                            .filter(lead => activeTab === 'todos' || lead.urgent)
                            .map((lead) => (
                                <div
                                    key={lead.session_id}
                                    onClick={() => handleSelectLead(lead.session_id)}
                                    className={cn(
                                        "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all duration-200 relative group",
                                        selectedLeadId === lead.session_id
                                            ? "bg-[#16697A]/5 border-l-4 border-l-[#16697A]"
                                            : lead.urgent
                                                ? "border-l-4 border-l-red-500 bg-red-50/50"
                                                : "border-l-4 border-l-transparent"
                                    )}
                                >
                                    {/* Urgent Badge */}
                                    {lead.urgent && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                            </span>
                                            URGENTE
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className="relative flex-shrink-0">
                                            <div className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                                                selectedLeadId === lead.session_id
                                                    ? "bg-[#16697A] text-white shadow-md shadow-[#16697A]/20"
                                                    : lead.urgent
                                                        ? "bg-red-100 text-red-600 ring-2 ring-red-500/30"
                                                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                            )}>
                                                {lead.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {lead.agent_paused && (
                                                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center">
                                                    <span className="h-1 w-1 bg-white rounded-full"></span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className={cn(
                                                    "font-semibold text-sm truncate",
                                                    selectedLeadId === lead.session_id
                                                        ? "text-[#16697A]"
                                                        : lead.urgent
                                                            ? "text-red-700"
                                                            : "text-gray-900"
                                                )}>
                                                    {lead.name}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">{lead.last_time || '12:00'}</span>
                                            </div>
                                            <p className={cn(
                                                "text-xs truncate pr-2 leading-relaxed block",
                                                selectedLeadId === lead.session_id
                                                    ? "text-[#16697A]/80 font-medium"
                                                    : lead.urgent
                                                        ? "text-red-600/80"
                                                        : "text-gray-500"
                                            )}>
                                                {lead.last_message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Right Area: Chat - Hidden on mobile when viewing list */}
                <div className={cn(
                    "flex-1 flex flex-col bg-gray-50",
                    mobileView === 'list' ? "hidden lg:flex" : "flex"
                )}>
                    {selectedLead ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-14 lg:h-16 border-b border-gray-200 flex items-center justify-between px-3 lg:px-6 bg-white">
                                <div className="flex items-center gap-2 lg:gap-3">
                                    {/* Back button for mobile */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="lg:hidden h-8 w-8 text-gray-600"
                                        onClick={handleBackToList}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="relative">
                                        <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-[#16697A]/10 flex items-center justify-center text-[#16697A] font-bold text-xs lg:text-sm border border-[#16697A]/20">
                                            {selectedLead.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="absolute bottom-0 right-0 h-2 w-2 lg:h-2.5 lg:w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-semibold text-xs lg:text-sm text-gray-900 leading-tight truncate max-w-[120px] lg:max-w-none">{selectedLead.name}</h3>
                                        <span className="text-[10px] lg:text-[11px] text-green-600 font-medium flex items-center gap-1">
                                            • Online
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 lg:gap-3 flex-shrink-0">
                                    <div className="flex items-center gap-1 lg:gap-2 bg-gray-50 rounded-lg px-2 lg:px-3 py-1 lg:py-1.5 border border-gray-200 shadow-sm">
                                        <span className="text-[10px] lg:text-xs font-medium text-gray-600 hidden sm:inline">IA</span>
                                        <Switch
                                            checked={!selectedLead.agent_paused} // Checked = AI Active
                                            onCheckedChange={() => togglePause(selectedLead.session_id, selectedLead.agent_paused)}
                                            className={cn("scale-[0.6] lg:scale-75", !selectedLead.agent_paused ? "bg-green-500" : "bg-zinc-200")}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 lg:h-9 lg:w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        title="Excluir lead"
                                    >
                                        <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 bg-[#FAF8F5]">
                                <div className="max-w-4xl mx-auto w-full space-y-4 lg:space-y-6">
                                    {messages.filter(msg => msg.content && msg.content.trim() !== '').map((msg) => (
                                        <div key={msg.id} className={cn("flex", msg.role === 'assistant' ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[85%] lg:max-w-[65%] rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-sm shadow-sm transition-all",
                                                msg.role === 'assistant'
                                                    ? "bg-[#16697A] text-white rounded-br-none shadow-md"
                                                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                                            )}>
                                                <p className="leading-relaxed text-[13px] lg:text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                                <span className={cn("block text-[10px] mt-2 text-right opacity-70", msg.role === 'assistant' ? "text-white" : "text-gray-400")}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="p-3 lg:p-6 bg-white border-t border-gray-100">
                                <div className="flex gap-2 lg:gap-3 items-center max-w-4xl mx-auto w-full">
                                    <Input
                                        value={msgInput}
                                        onChange={(e) => setMsgInput(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-[#16697A] h-10 lg:h-11 rounded-xl shadow-inner text-gray-900 placeholder:text-gray-400 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <Button onClick={sendMessage} size="icon" className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#16697A] hover:bg-[#125866] shadow-md transition-all active:scale-95">
                                        <Send className="h-4 w-4 lg:h-5 lg:w-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4 p-4">
                            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <MessageCircle className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-center">Selecione uma conversa para iniciar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Excluir Lead</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir o lead <strong>{selectedLead?.name}</strong>? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleteLoading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                    onClick={deleteLead}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Excluindo...' : 'Excluir'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
