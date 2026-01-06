export function Header() {
    return (
        <header className="flex h-14 items-center border-b bg-card px-6">
            <h1 className="text-lg font-semibold">Painel de Controle</h1>
            <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Usuário: riobutcher</span>
                <div className="h-8 w-8 rounded-full bg-primary/20" />
            </div>
        </header>
    );
}
