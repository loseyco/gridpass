export default function SocialLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <div className="flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
