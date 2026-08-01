'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Success
                scanner.clear();
                onScan(decodedText);
            },
            (err) => {
                // Error - usually just "not found in frame", so ignore
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0D1F1F] rounded-3xl border border-[#14FFEC]/30 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-[#14FFEC]/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#14FFEC]" />
                        <h2 className="text-white font-bold">Scan Ticket QR</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div id="qr-reader" className="w-full overflow-hidden rounded-xl bg-black/40"></div>
                    
                    {error && (
                        <p className="mt-4 text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex flex-col items-center gap-2">
                        <p className="text-white/60 text-xs text-center">
                            Position the QR code within the frame to scan automatically.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-[#0A1A1A] border-t border-[#14FFEC]/10">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-[#14FFEC]/10 text-[#14FFEC] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#14FFEC]/20 transition-all"
                    >
                        <RefreshCw size={18} />
                        Reset Camera
                    </button>
                </div>
            </div>
        </div>
    );
};
