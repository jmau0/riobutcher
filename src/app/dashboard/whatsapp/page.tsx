"use client";

import { useState } from "react";
import { QrCode, RefreshCw, Smartphone, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function WhatsAppConnectionCard({ title, instanceName }: { title: string, instanceName: string }) {
    const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerateQR = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://webhook.riobutcher.cloud/webhook/3ffa3f9a-0011-4389-b274-ab2dde07177b', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate_qr', instance: instanceName })
            });
            const data = await response.json();
            // Expecting Base64 string in response, e.g. { qrcode: "data:image/png;base64,..." }
            if (data.qrcode) {
                setQrCode(data.qrcode);
            } else if (data.base64) {
                setQrCode(`data:image/png;base64,${data.base64}`);
            } else if (typeof data === 'string') {
                // If response is just the base64 string directly
                setQrCode(data.startsWith('data:') ? data : `data:image/png;base64,${data}`);
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="flex flex-col h-full border-gray-200 bg-white shadow-sm">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#16697A]/5 ring-1 ring-[#16697A]/20">
                    <Smartphone className={cn("h-8 w-8", status === 'connected' ? "text-green-500" : "text-[#16697A]")} />
                </div>

                <div className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium ring-1 ring-black/5 mb-2">
                    {status === 'connected' ? (
                        <span className="text-green-600 font-semibold">Online</span>
                    ) : (
                        <span className="text-red-500 font-semibold">Offline</span>
                    )}
                </div>

                <CardTitle className="text-lg text-gray-900">{title}</CardTitle>
                <CardDescription className="text-xs text-gray-500">{instanceName}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6 pt-4">
                {status === 'connected' ? (
                    <div className="flex flex-col items-center gap-2">
                        <ShieldCheck className="h-12 w-12 text-green-500" />
                        <p className="text-sm font-medium text-muted-foreground w-1/2 text-center">Conexão estabelecida e operando normalmente.</p>
                    </div>
                ) : qrCode ? (
                    <div className="bg-white p-2 rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt="QR Code" className="h-40 w-40" />
                    </div>
                ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400 text-xs text-center p-4">
                        Clique para gerar QR Code
                    </div>
                )}

                <div className="w-full mt-auto space-y-2">
                    {status !== 'connected' && (
                        <Button
                            variant="outline"
                            className="w-full border-gray-200 hover:bg-gray-50 text-gray-700"
                            onClick={handleGenerateQR}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                            {loading ? "Gerando..." : "Novo QR Code"}
                        </Button>
                    )}
                    <Button
                        variant={status === 'connected' ? 'destructive' : 'default'}
                        className={cn("w-full shadow-md transition-all active:scale-95", status !== 'connected' && "bg-[#16697A] hover:bg-[#125866]")}
                        onClick={() => setStatus(status === 'connected' ? 'disconnected' : 'connected')}
                    >
                        {status === 'connected' ? 'Desconectar' : 'Simular Conexão'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function WhatsAppPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Conexão WhatsApp</h2>
                <p className="text-muted-foreground">Gerencie a conexão da sua instância principal</p>
            </div>

            <div className="grid gap-6 grid-cols-1">
                <WhatsAppConnectionCard title="Linha Principal" instanceName="rio-butcher-main" />
            </div>
        </div>
    );
}
