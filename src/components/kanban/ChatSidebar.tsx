"use client";

import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

interface ChatSidebarProps {
    sessionId: string | null;
    onClose: () => void;
}

export function ChatSidebar({ sessionId, onClose }: ChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchHistory(sessionId);
        }
    }, [sessionId]);

    async function fetchHistory(sid: string) {
        setLoading(true);
        // Mock data
        const mockMessages: Message[] = [
            { id: '1', role: 'user', content: 'Olá, gostaria de saber o preço da Picanha', created_at: new Date().toISOString() },
            { id: '2', role: 'assistant', content: 'Olá! A Picanha Wagyu está R$ 350,00/kg. Gostaria de reservar?', created_at: new Date().toISOString() },
        ];

        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            const { data, error } = await supabase
                .from('medx34_history')
                .select('*')
                .eq('session_id', sid)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data as any); // Type casting for MVP
            } else {
                setMessages(mockMessages);
            }
        } else {
            setMessages(mockMessages);
        }
        setLoading(false);
    }

    async function handleSend() {
        if (!newMessage.trim()) return;
        // Here we would call the Uazapi/Evolution API
        console.log(`Sending message to ${sessionId}: ${newMessage}`);

        // Optimistic update
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: newMessage,
            created_at: new Date().toISOString()
        }]);
        setNewMessage("");
    }

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 w-[400px] border-l bg-card shadow-2xl transition-transform duration-300 ease-in-out transform",
            sessionId ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="flex h-14 items-center justify-between border-b px-4">
                <h3 className="font-semibold">Histórico de Conversa</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex flex-col h-[calc(100vh-3.5rem)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                    msg.role === 'user'
                                        ? "bg-zinc-800 text-white self-start"
                                        : "bg-primary text-primary-foreground self-end"
                                )}
                            >
                                {msg.content}
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t p-4">
                    <div className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite uma mensagem..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <Button onClick={handleSend} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
