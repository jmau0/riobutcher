import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Activity, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MetricsProps {
    totalSales: number;
    abandonedCarts: number;
    abandonedOrders?: number;
    aiEfficiency: number;
}

export function MetricsCards({ totalSales, abandonedCarts, abandonedOrders = 0, aiEfficiency }: MetricsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-l-4 border-l-green-500/50 shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Volume de Vendas</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">{formatCurrency(totalSales)}</span>
                            </div>
                        </div>
                        <div className="rounded-full bg-green-500/10 p-3 ring-1 ring-green-500/20">
                            <DollarSign className="h-6 w-6 text-green-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-orange-500/50 shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Carrinhos Abandonados</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">{abandonedCarts}</span>
                            </div>
                        </div>
                        <div className="rounded-full bg-orange-500/10 p-3 ring-1 ring-orange-500/20">
                            <ShoppingCart className="h-6 w-6 text-orange-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-red-500/50 shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pedidos Não Pagos</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">{abandonedOrders}</span>
                            </div>
                        </div>
                        <div className="rounded-full bg-red-500/10 p-3 ring-1 ring-red-500/20">
                            <XCircle className="h-6 w-6 text-red-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-blue-500/50 shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Taxa de Conversão</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">{aiEfficiency.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="rounded-full bg-blue-500/10 p-3 ring-1 ring-blue-500/20">
                            <Activity className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
