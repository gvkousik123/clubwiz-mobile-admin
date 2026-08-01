'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Camera, CheckCircle, XCircle, Loader2, Upload } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { TicketScanService } from '@/lib/services/ticket-scan.service';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
    onClose: () => void;
    onScanSuccess?: (bookingId: string, data: any) => void;
    onScanError?: (error: string) => void;
}

export function QRScanner({ onClose, onScanSuccess, onScanError }: QRScannerProps) {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
    const [scanMessage, setScanMessage] = useState('');
    const [manualInput, setManualInput] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let mounted = true;
        
        // Small delay to ensure DOM is ready and prevent strict-mode double-start issues
        const timer = setTimeout(() => {
            if (mounted) {
                startScanner();
            }
        }, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            // Wait for element to be available
            if (!document.getElementById('qr-reader')) {
                throw new Error("QR reader element not found");
            }

            // Check if cameras are available and permissions are granted
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                throw new Error("No cameras found on this device");
            }

            // Stop existing if any
            if (scannerRef.current?.isScanning) {
                await stopScanner();
            }

            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            const config = {
                fps: 10,
                qrbox: { width: 300, height: 300 },
                aspectRatio: 1.0,
                disableFlip: false, // Helps if camera is mirrored
            };

            // Try environment first, fallback to first available
            try {
                await scanner.start({ facingMode: 'environment' }, config, handleQRDetected, handleQRError);
            } catch (envError) {
                console.log("Environment camera failed, falling back to default camera");
                await scanner.start(cameras[0].id, config, handleQRDetected, handleQRError);
            }
            
            setIsCameraActive(true);
        } catch (error: any) {
            console.error('Scanner start error:', error);
            
            // Check if it's an HTTP/HTTPS issue
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const isHttps = window.location.protocol === 'https:';
            
            let errorMessage = error.message || 'Unable to access camera.';
            if (!isLocalhost && !isHttps) {
                errorMessage = 'Camera access requires HTTPS or localhost. Please use manual entry or upload image.';
            }

            toast({
                title: 'Camera Error',
                description: errorMessage,
                variant: 'destructive'
            });
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
        setIsCameraActive(false);
    };

    const handleQRDetected = (decodedText: string) => {
        console.log('QR Code detected:', decodedText);
        handleScan(decodedText);
    };

    const handleQRError = (error: any) => {
        // Ignore scan failures - they happen constantly while scanning
    };

    const handleScan = async (bookingId: string) => {
        if (isScanning) return;

        setIsScanning(true);
        setScanResult(null);
        setScanMessage('');

        try {
            // Validate QR code format
            const validatedId = TicketScanService.validateQRCode(bookingId);

            if (!validatedId) {
                throw new Error('Invalid QR code format');
            }

            // Call scan API
            const result = await TicketScanService.scanTicket(validatedId);

            if (result.success) {
                setScanResult('success');
                setScanMessage(`✅ ${result.data?.ticketNumber || validatedId} - ${result.message}`);

                toast({
                    title: 'Ticket Scanned Successfully',
                    description: result.message,
                });

                // Wait a bit before navigating to show success message
                setTimeout(() => {
                    onScanSuccess?.(validatedId, result.data);
                }, 1000);

                // Auto close after 2.5 seconds
                setTimeout(() => {
                    onClose();
                }, 2500);
            } else {
                setScanResult('error');
                
                // Pause scanner on error to prevent loops
                if (scannerRef.current) {
                    scannerRef.current.pause(true);
                }

                // Check if it's an access denied error
                const isAccessDenied = result.message?.toLowerCase().includes('access denied') ||
                                      result.message?.toLowerCase().includes('not allowed') ||
                                      result.message?.toLowerCase().includes('permission');
                setScanMessage(result.message);

                toast({
                    title: isAccessDenied ? 'Access Denied' : 'Scan Failed',
                    description: isAccessDenied
                        ? "You're not the owner of this club to scan these tickets."
                        : result.message,
                    variant: 'destructive'
                });

                onScanError?.(result.message);
            }
        } catch (error: any) {
            setScanResult('error');
            
            // Pause scanner on error to prevent loops
            if (scannerRef.current) {
                scannerRef.current.pause(true);
            }

            const errorMsg = error.message || 'Failed to scan ticket';
            setScanMessage(errorMsg);

            toast({
                title: 'Scan Error',
                description: errorMsg,
                variant: 'destructive'
            });

            onScanError?.(errorMsg);
        } finally {
            setIsScanning(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('📁 File selected:', file.name);

        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        try {
            // Stop camera scanner first
            await stopScanner();
            setIsCameraActive(false);
            
            console.log('📸 Scanning QR from uploaded file...');
            
            // Create a temporary scanner for file scanning
            const html5QrCode = new Html5Qrcode('qr-reader');
            const result = await html5QrCode.scanFile(file, true);
            console.log('✅ QR Code from file:', result);
            
            // Clean up scanner first
            await html5QrCode.clear();
            
            // Handle the scan
            await handleScan(result);
            
            // Reset file input to allow re-upload
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('❌ File scan error:', error);
            toast({
                title: 'Scan Error',
                description: error?.message || 'Could not read QR code from image. Please try another image.',
                variant: 'destructive'
            });
            
            // Restart camera scanner
            setUploadedImage(null);
            startScanner();
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualInput.trim()) {
            handleScan(manualInput.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
                >
                    <X size={24} />
                </button>

                {/* Scanner Card */}
                <div className="bg-[#031313]/90 backdrop-blur-xl border border-[#14FFEC]/20 rounded-3xl p-6 shadow-2xl overflow-y-auto scrollbar-hide">
                    {/* Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Scan Ticket QR Code</h2>
                        <p className="text-white/60 text-sm">Position the QR code within the frame</p>
                    </div>

                    {/* Camera View */}
                    <div className="relative mb-6">
                        <div className="relative aspect-square bg-black rounded-2xl overflow-hidden border-2 border-[#14FFEC]/30">
                            {/* QR Reader Container */}
                            <div id="qr-reader" className="w-full h-full"></div>

                            {/* Uploaded Image Preview */}
                            {uploadedImage && (
                                <div className="absolute inset-0 z-[5] bg-black flex items-center justify-center">
                                    <img 
                                        src={uploadedImage} 
                                        alt="Uploaded QR Code" 
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            )}

                            {/* Scanning Indicator */}
                            {isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                    <Loader2 className="w-12 h-12 text-[#14FFEC] animate-spin" />
                                </div>
                            )}

                            {/* Result Overlay */}
                            {scanResult && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 p-6">
                                    <div className="text-center w-full">
                                        {scanResult === 'success' ? (
                                            <>
                                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
                                                <p className="text-white font-bold text-lg mb-2">Success!</p>
                                                <p className="text-white/80 text-sm">{scanMessage}</p>
                                                <p className="text-white/60 text-xs mt-3">Redirecting to ticket details...</p>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                                <p className="text-white font-bold text-lg mb-2">Scan Failed</p>
                                                <p className="text-white/80 text-sm mb-6">{scanMessage}</p>
                                                <button 
                                                    onClick={() => {
                                                        setScanResult(null);
                                                        setScanMessage('');
                                                        if (scannerRef.current) {
                                                            scannerRef.current.resume();
                                                        }
                                                    }}
                                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
                                                >
                                                    Try Again
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload QR Image Button */}
                    <div className="mb-6">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isScanning}
                            className="w-full bg-white/5 border border-white/10 hover:border-[#14FFEC]/50 text-white rounded-2xl px-4 py-3 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-5 h-5 text-[#14FFEC]" />
                            <span className="font-medium">Upload QR Code Image</span>
                        </button>
                    </div>

                    {/* Manual Entry */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 border-t border-white/10"></div>
                            <span className="text-white/40 text-sm uppercase tracking-wider">Or</span>
                            <div className="flex-1 border-t border-white/10"></div>
                        </div>

                        <form onSubmit={handleManualSubmit} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Enter Booking ID"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 focus:border-[#14FFEC]/50 text-white rounded-2xl px-4 py-3 outline-none focus:bg-white/10 transition-all font-medium placeholder:text-white/20"
                            />
                            <button
                                type="submit"
                                disabled={isScanning || !manualInput.trim()}
                                className="w-full bg-gradient-to-r from-[#14FFEC] to-[#00867D] text-[#031313] font-black text-[15px] uppercase tracking-[0.2em] rounded-2xl py-4 shadow-[0_0_20px_rgba(20,255,236,0.2)] hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                            >
                                {isScanning ? 'Scanning...' : 'Scan Manually'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
