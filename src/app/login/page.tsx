"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Simulação de delay para feedback visual
        await new Promise(resolve => setTimeout(resolve, 800));

        if (username === "riobutcher" && password === "riobutcher123") {
            // Define cookie
            document.cookie = "auth=true; path=/; max-age=86400"; // 1 dia
            router.push("/dashboard");
        } else {
            setError("Credenciais inválidas. Tente novamente.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#16697A]/5 blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#16697A]/10 blur-3xl opacity-50" />
            </div>

            <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                    <div className="p-8 sm:p-10">
                        {/* Header com Logo */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="h-20 w-20 bg-[#16697A]/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-[#16697A]/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/logo.png"
                                    alt="Rio Butcher"
                                    className="h-12 w-auto object-contain brightness-0 opacity-90"
                                />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bem-vindo de volta!</h1>
                            <p className="text-sm text-gray-500 mt-2">Acesse o painel de controle</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 ml-1 uppercase tracking-wide">Usuário</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Digite seu usuário"
                                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus-visible:ring-[#16697A] focus-visible:border-[#16697A] transition-all rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 ml-1 uppercase tracking-wide">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Digite sua senha"
                                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus-visible:ring-[#16697A] focus-visible:border-[#16697A] transition-all rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center font-medium animate-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className={cn(
                                    "w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-[#16697A]/20 transition-all active:scale-[0.98]",
                                    "bg-[#16697A] hover:bg-[#125866]"
                                )}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Entrando...
                                    </div>
                                ) : (
                                    "Entrar no Painel"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    &copy; {new Date().getFullYear()} Rio Butcher. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
