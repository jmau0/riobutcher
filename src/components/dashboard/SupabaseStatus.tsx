"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function SupabaseConnectionStatus() {
    const [status, setStatus] = useState<'loading' | 'connected' | 'error' | 'missing_env'>('loading');

    useEffect(() => {
        // Verifica se as variáveis de ambiente estão presentes
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key || url.includes('placeholder') || key === 'placeholder') {
            setStatus('missing_env');
            return;
        }

        async function checkConnection() {
            try {
                const { error } = await supabase.from('dados_cliente').select('count', { count: 'exact', head: true });
                if (error) throw error;
                setStatus('connected');
            } catch (e) {
                console.error('Supabase connection error:', e);
                setStatus('error');
            }
        }

        checkConnection();
    }, []);

    if (status === 'connected') return null; // Não mostra nada se estiver tudo ok

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 duration-300 bg-white">
            {status === 'missing_env' && (
                <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Configuração Necessária</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            As variáveis de ambiente do Supabase não foram detectadas neste ambiente.
                        </p>
                        <div className="mt-2 bg-gray-100 p-2 rounded text-[10px] font-mono text-gray-600 break-all">
                            NEXT_PUBLIC_SUPABASE_URL<br />
                            NEXT_PUBLIC_SUPABASE_ANON_KEY
                        </div>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Erro de Conexão</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Não foi possível conectar ao banco de dados Supabase. Verifique suas credenciais na Vercel.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
