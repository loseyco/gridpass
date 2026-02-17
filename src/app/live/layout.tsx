export default function LiveLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="w-full h-screen bg-black overflow-hidden relative">
            {children}
        </div>
    );
}
