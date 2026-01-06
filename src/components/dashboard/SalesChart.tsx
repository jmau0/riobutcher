"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesData {
    hour: string;
    sales: number;
}

interface SalesChartProps {
    data: SalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Atendimentos por Hora</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="hour"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ background: '#000', border: '1px solid #333' }}
                            labelStyle={{ color: '#888' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="sales" fill="#8B0000" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
