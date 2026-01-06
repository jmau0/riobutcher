"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "riobutcher" && password === "riobutcher123") {
            // Simulate login
            document.cookie = "auth=true; path=/";
            router.push("/dashboard");
        } else {
            setError("Credenciais inválidas");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <Card className="w-[400px] border-primary/20 bg-zinc-950">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Rio Butcher</CardTitle>
                    <p className="text-sm text-muted-foreground">Acesso ao Dashboard</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Usuário</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Usuário"
                                className="bg-zinc-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Senha</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Senha"
                                className="bg-zinc-900"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
