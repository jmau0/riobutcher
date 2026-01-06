import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/context/SidebarContext";
import { SupabaseConnectionStatus } from "@/components/dashboard/SupabaseStatus";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden bg-background text-foreground">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                        {children}
                    </main>
                    <SupabaseConnectionStatus />
                </div>
            </div>
        </SidebarProvider>
    );
}
