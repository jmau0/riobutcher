"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, SquareKanban, Smartphone, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Kanban", href: "/dashboard/kanban", icon: SquareKanban },
    { name: "WhatsApp", href: "/dashboard/whatsapp", icon: Smartphone },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isOpen, close } = useSidebar();

    return (
        <>
            {/* Overlay para mobile - clicável para fechar */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-white text-gray-600 border-r border-gray-200 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header com botão de fechar em mobile */}
                <div className="flex h-20 items-center justify-between border-b border-gray-100 px-4">
                    {/* Logo Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.png"
                        alt="Rio Butcher"
                        className="h-10 w-auto object-contain brightness-0 opacity-80"
                    />
                    {/* Botão fechar - apenas mobile */}
                    <button
                        onClick={close}
                        className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={close}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-[#16697A] text-white shadow-md shadow-[#16697A]/20"
                                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
                            window.location.href = "/login";
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-left"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </button>
                </div>
            </aside>
        </>
    );
}
