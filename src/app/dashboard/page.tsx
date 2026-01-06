"use client";

import { useEffect, useState } from "react";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, UserCheck, MessageCircle, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export default function DashboardPage() {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');

    const [metrics, setMetrics] = useState({
        totalSales: 0,
        abandonedCarts: 0,
        abandonedOrders: 0,
        aiEfficiency: 0,
    });

    const [pipeline, setPipeline] = useState({
        em_atendimento: 0,
        nao_respondidos: 0,
        em_negociacao: 0,
        fechados: 0
    });

    const [urgentLeads, setUrgentLeads] = useState<{ nome: string, telefone: string, sessionid: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Get date filter based on selected period (returns ISO timestamp for Supabase)
    const getDateFilter = (period: TimePeriod): string | null => {
        const now = new Date();
        switch (period) {
            case 'today':
                // Start of today in local time, converted to ISO
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return startOfToday.toISOString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return weekAgo.toISOString();
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return monthAgo.toISOString();
            case 'all':
                return null;
        }
    };

    useEffect(() => {
        async function fetchData() {
            let newMetrics = {
                totalSales: 0,
                abandonedCarts: 0,
                abandonedOrders: 0,
                aiEfficiency: 0,
            };

            let newPipeline = {
                em_atendimento: 0,
                nao_respondidos: 0,
                em_negociacao: 0,
                fechados: 0
            };

            if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
                try {
                    const dateFilter = getDateFilter(timePeriod);

                    // 1. Fetch metrics from 'dashboard' table
                    let dashboardQuery = supabase
                        .from('dashboard')
                        .select('vendidos, abandono_carrinho, abandono_pedido, created_at');

                    if (dateFilter) {
                        dashboardQuery = dashboardQuery.gte('created_at', dateFilter);
                    }

                    // 2. Fetch Pipeline Counts from 'dados_cliente'
                    const pipelinePromise = supabase
                        .from('dados_cliente')
                        .select('status_pipeline');

                    // 3. Fetch Urgent Leads
                    const urgentPromise = supabase
                        .from('dados_cliente')
                        .select('nome, telefone, sessionid')
                        .eq('urgente', true);

                    const [dashboardRes, pipelineRes, urgentRes] = await Promise.all([
                        dashboardQuery,
                        pipelinePromise,
                        urgentPromise
                    ]);

                    console.log('[Dashboard] Raw data:', dashboardRes.data);
                    console.log('[Dashboard] Query error:', dashboardRes.error);
                    console.log('[Dashboard] Date filter used:', dateFilter);

                    // Process Dashboard metrics
                    if (dashboardRes.data) {
                        let totalSales = 0;
                        let abandonedCarts = 0;
                        let abandonedOrders = 0;

                        dashboardRes.data.forEach((row: any) => {
                            // Parse 'vendidos' - can be a number or text
                            if (row.vendidos) {
                                const value = parseFloat(String(row.vendidos).replace(',', '.'));
                                if (!isNaN(value)) totalSales += value;
                            }
                            // Count abandono_carrinho (only if value > 0)
                            const carrinhoVal = parseFloat(String(row.abandono_carrinho || 0));
                            if (carrinhoVal > 0) {
                                abandonedCarts++;
                            }
                            // Count abandono_pedido (only if value > 0)
                            const pedidoVal = parseFloat(String(row.abandono_pedido || 0));
                            if (pedidoVal > 0) {
                                abandonedOrders++;
                            }
                        });

                        newMetrics.totalSales = totalSales;
                        newMetrics.abandonedCarts = abandonedCarts;
                        newMetrics.abandonedOrders = abandonedOrders;

                        // AI Efficiency: ratio of sales to total events
                        const totalEvents = dashboardRes.data.length;
                        if (totalEvents > 0) {
                            const salesCount = dashboardRes.data.filter((r: any) => r.vendidos && r.vendidos !== 'NULL').length;
                            newMetrics.aiEfficiency = (salesCount / totalEvents) * 100;
                        }
                    }

                    // Process Pipeline from 'dados_cliente'
                    if (pipelineRes.data) {
                        const counts = pipelineRes.data.reduce((acc: any, curr: any) => {
                            const status = curr.status_pipeline?.toLowerCase().trim();
                            if (status === 'em_atendimento') acc.em_atendimento++;
                            if (status === 'nao_respondido') acc.nao_respondidos++;
                            if (status === 'em_negociacao') acc.em_negociacao++;
                            if (status === 'fechado') acc.fechados++;
                            return acc;
                        }, {
                            em_atendimento: 0,
                            nao_respondidos: 0,
                            em_negociacao: 0,
                            fechados: 0
                        });
                        newPipeline = counts;
                    }

                    // Process Urgent Leads
                    if (urgentRes.data) {
                        setUrgentLeads(urgentRes.data);
                    }

                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                }
            } else {
                // Fallback Mock Data
                newMetrics = {
                    totalSales: 15430.50,
                    abandonedCarts: 12,
                    abandonedOrders: 3,
                    aiEfficiency: 85,
                };
                newPipeline = {
                    em_atendimento: 5,
                    nao_respondidos: 2,
                    em_negociacao: 3,
                    fechados: 12
                };
            }

            setMetrics(newMetrics);
            setPipeline(newPipeline);
            setLoading(false);
        }

        fetchData();
    }, [timePeriod]); // Re-fetch when period changes

    // Realtime subscription for updates
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const channel = supabase
            .channel('dashboard_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dados_cliente'
                },
                (payload) => {
                    console.log('[Dashboard Realtime] Change detected:', payload.eventType);
                    // Refetch urgent leads
                    supabase
                        .from('dados_cliente')
                        .select('nome, telefone, sessionid')
                        .eq('urgente', true)
                        .then(({ data }) => {
                            if (data) setUrgentLeads(data);
                        });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex bg-background h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse">Carregando dados da operação...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
                <p className="text-muted-foreground">Visão geral em tempo real</p>
            </div>

            {/* Section: Leads Urgentes */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    Leads Urgentes
                    {urgentLeads.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {urgentLeads.length}
                        </span>
                    )}
                </h3>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                    {urgentLeads.length > 0 ? (
                        <div className="space-y-2">
                            {urgentLeads.map((lead) => (
                                <div
                                    key={lead.sessionid}
                                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                                                {(lead.nome || '??').substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{lead.nome || 'Cliente'}</p>
                                            <p className="text-xs text-gray-500">{lead.telefone || lead.sessionid}</p>
                                        </div>
                                    </div>
                                    <a
                                        href="/dashboard/kanban"
                                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                                    >
                                        Atender
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Nenhum lead urgente pendente!
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Métricas */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Métricas
                    </h3>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 overflow-x-auto scrollbar-hide max-w-full">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 px-3 rounded-md text-sm whitespace-nowrap",
                                timePeriod === 'today' ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            )}
                            onClick={() => setTimePeriod('today')}
                        >
                            Hoje
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 px-3 rounded-md text-sm whitespace-nowrap",
                                timePeriod === 'week' ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            )}
                            onClick={() => setTimePeriod('week')}
                        >
                            7 Dias
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 px-3 rounded-md text-sm whitespace-nowrap",
                                timePeriod === 'month' ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            )}
                            onClick={() => setTimePeriod('month')}
                        >
                            30 Dias
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 px-3 rounded-md text-sm whitespace-nowrap",
                                timePeriod === 'all' ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            )}
                            onClick={() => setTimePeriod('all')}
                        >
                            Tudo
                        </Button>
                    </div>
                </div>
                <MetricsCards
                    totalSales={metrics.totalSales}
                    abandonedCarts={metrics.abandonedCarts}
                    abandonedOrders={metrics.abandonedOrders}
                    aiEfficiency={metrics.aiEfficiency}
                />
            </div>

            {/* Section: Pipeline Rápido */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-primary">Pipeline Rápido</h3>
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors">Ver Detalhes →</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <PipelineCard
                        label="Em Atendimento"
                        count={pipeline.em_atendimento}
                        status="ATIVO"
                        icon={MessageCircle}
                        color="text-blue-500"
                        bgColor="bg-blue-500/10"
                    />
                    <PipelineCard
                        label="Não Respondidos"
                        count={pipeline.nao_respondidos}
                        status="ATENÇÃO"
                        icon={XCircle}
                        color="text-orange-500"
                        bgColor="bg-orange-500/10"
                    />
                    <PipelineCard
                        label="Em Negociação"
                        count={pipeline.em_negociacao}
                        status="PROGRESSO"
                        icon={UserCheck}
                        color="text-purple-500"
                        bgColor="bg-purple-500/10"
                    />
                    <PipelineCard
                        label="Fechados"
                        count={pipeline.fechados}
                        status="SUCESSO"
                        icon={CheckCircle2}
                        color="text-green-500"
                        bgColor="bg-green-500/10"
                    />
                </div>
            </div>
        </div>
    );
}

function PipelineCard({ label, count, status, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border-l-4 border-l-gray-200 hover:border-l-primary transition-all shadow-sm hover:shadow-md bg-white">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                <span className="text-3xl font-bold text-gray-900">{count}</span>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${bgColor} ${color}`}>
                    {status}
                </div>
            </CardContent>
        </Card>
    )
}
