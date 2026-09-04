'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { QRScanner } from '@/components/qr-scanner/qr-scanner';

interface ScanHistory {
    id: string;
    bookingId: string;
    status: 'success' | 'error';
    message: string;
    timestamp: Date;
}

export default function ScanTicketsPage() {
    const router = useRouter();
    const [showScanner, setShowScanner] = useState(false);
    const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);

    const handleScanSuccess = (bookingId: string, data: any) => {
        const newScan: ScanHistory = {
            id: Date.now().toString(),
            bookingId,
            status: 'success',
            message: data.message || 'Ticket scanned successfully',
            timestamp: new Date()
        };
        
        setScanHistory(prev => [newScan, ...prev]);
        
        // Redirect to ticket details page
        router.push(`/bz/admin/ticket-details/${bookingId}`);
    };

    const handleScanError = (error: string) => {
        const newScan: ScanHistory = {
            id: Date.now().toString(),
            bookingId: 'Unknown',
            status: 'error',
            message: error,
            timestamp: new Date()
        };
        
        setScanHistory(prev => [newScan, ...prev]);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white relative">
            {/* Fixed Header */}
            <div className="fixed top-0 app-bar z-30 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px]">
                <div className="px-6 pt-10 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Scan Tickets</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-0 relative mt-[100px] z-40">
                <div className="w-full bg-[#021313] rounded-t-[40px] flex flex-col min-h-[calc(100vh-100px)] p-6">
                    
                    {/* Scan Button */}
                    <div className="mb-8">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-full bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-6 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
                        >
                            <QrCode size={24} />
                            Start Scanning
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-white/60 text-sm">Successful</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {scanHistory.filter(s => s.status === 'success').length}
                            </p>
                        </div>
                        <div className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="w-5 h-5 text-red-500" />
                                <span className="text-white/60 text-sm">Failed</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {scanHistory.filter(s => s.status === 'error').length}
                            </p>
                        </div>
                    </div>

                    {/* Scan History */}
                    <div className="flex-1">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-[#14FFEC]" />
                            Recent Scans
                        </h2>

                        {scanHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <QrCode size={64} className="text-white/10 mx-auto mb-4" />
                                <p className="text-white/40">No scans yet</p>
                                <p className="text-white/30 text-sm mt-2">Start scanning tickets to see history</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scanHistory.map((scan, index) => (
                                    <div
                                        key={scan.id}
                                        className="bg-[#0D1F1F]/70 backdrop-blur-xl border border-[#14FFEC]/10 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-6 duration-500 fill-mode-both"
                                        style={{ animationDelay: `${index * 80}ms` }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {scan.status === 'success' ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                                )}
                                                <span className="font-bold text-white">{scan.bookingId}</span>
                                            </div>
                                            <span className="text-white/40 text-xs">{formatTime(scan.timestamp)}</span>
                                        </div>
                                        <p className={`text-sm ml-7 ${scan.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                            {scan.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner
                    onClose={() => setShowScanner(false)}
                    onScanSuccess={handleScanSuccess}
                    onScanError={handleScanError}
                />
            )}
        </div>
    );
}
