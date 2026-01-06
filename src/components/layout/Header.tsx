"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export function Header() {
    const { toggle } = useSidebar();

    return (
        <header className="flex h-14 items-center border-b bg-card px-4 lg:px-6">
            {/* Botão hamburger - apenas mobile */}
            <button
                onClick={toggle}
                className="lg:hidden p-2 -ml-2 mr-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-lg font-semibold">Painel de Controle</h1>

            <div className="ml-auto flex items-center gap-2 lg:gap-4">
                <span className="text-xs lg:text-sm text-muted-foreground hidden sm:inline">
                    Usuário: riobutcher
                </span>
                <div className="h-8 w-8 rounded-full bg-primary/20" />
            </div>
        </header>
    );
}
