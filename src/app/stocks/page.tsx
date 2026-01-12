import { StockDashboard } from "@/components/stocks/StockDashboard";

export default function StocksPage() {
    return (
        <main className="min-h-screen bg-black text-white p-8 pb-32">
            <div className="max-w-5xl mx-auto space-y-12">

                <header className="flex flex-col gap-2">
                    <a href="/" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 w-fit mb-2">
                        ← Back to Dashboard
                    </a>
                    <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        Stocks & Investments
                    </h1>
                    <p className="text-gray-400 text-lg">Track your portfolio performance in real-time.</p>
                </header>

                <StockDashboard />
            </div>
        </main>
    );
}
