"use client";

import { useState } from "react";
import { User, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Lead {
    session_id: string;
    name: string;
    cpf: string;
    agent_paused: boolean;
}

interface KanbanCardProps {
    lead: Lead;
    onClick: () => void;
}

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
    const [paused, setPaused] = useState(lead.agent_paused);

    async function togglePause(val: boolean) {
        setPaused(val);
        try {
            if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
                await supabase
                    .from('atendimentos_agent')
                    .update({ agent_paused: val })
                    .eq('session_id', lead.session_id);
            }
        } catch (err) {
            console.error("Failed to update pause status", err);
            // Revert if failed
            setPaused(!val);
        }
    }

    return (
        <Card className="cursor-pointer transition-colors hover:bg-accent/10 border-l-4 border-l-primary" onClick={onClick}>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        {lead.name || "Cliente Desconhecido"}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MessageSquare className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    CPF: {lead.cpf || "---"}
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate">
                    ID: {lead.session_id}
                </div>

                <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-medium">Pausar Edu (AI)</span>
                    <Switch
                        checked={paused}
                        onCheckedChange={togglePause}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
