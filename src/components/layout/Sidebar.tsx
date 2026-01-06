"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, SquareKanban, Smartphone, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Kanban", href: "/dashboard/kanban", icon: SquareKanban },
    { name: "WhatsApp", href: "/dashboard/whatsapp", icon: Smartphone },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col bg-white text-gray-600 border-r border-gray-200">
            <div className="flex h-20 items-center justify-center border-b border-gray-100 px-4">
                {/* Logo Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo.png"
                    alt="Rio Butcher"
                    className="h-10 w-auto object-contain brightness-0 opacity-80"
                />
            </div>
            <nav className="flex-1 space-y-2 p-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
                <Link
                    href="/login"
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Link>
            </div>
        </div>
    );
}

