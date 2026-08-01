"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddEntryPricingPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [formData, setFormData] = useState({
        coupleEntryPrice: '',
        maleStagEntryPrice: '',
        femaleStagEntryPrice: '',
        groupEntryPrice: '',
        coverCharge: '',
        redeemDetails: ''
    });

    useEffect(() => {
        // Load existing pricing data from localStorage if available
        const savedPricing = localStorage.getItem('entryPricing');
        if (savedPricing) {
            try {
                const parsed = JSON.parse(savedPricing);
                setFormData(parsed);
            } catch (e) {
                console.error('Error parsing saved pricing:', e);
            }
        }
    }, []);

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleNumberChange = (field: string, value: string) => {
        // Allow zero values, prevent negative values
        if (value === '' || value === '-') {
            setFormData({ ...formData, [field]: '' });
        } else if (value === '0') {
            // Explicitly handle zero
            setFormData({ ...formData, [field]: '0' });
        } else {
            const numVal = parseInt(value);
            if (!isNaN(numVal) && numVal >= 0) {
                setFormData({ ...formData, [field]: numVal.toString() });
            }
        }
    };

    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem('entryPricing', JSON.stringify(formData));
        
        // Also save to parent form data via localStorage
        localStorage.setItem('coupleEntryPrice', formData.coupleEntryPrice || '0');
        localStorage.setItem('coverCharge', formData.coverCharge || '0');
        localStorage.setItem('redeemDetails', formData.redeemDetails || '');
        localStorage.setItem('maleStagEntryPrice', formData.maleStagEntryPrice || '0');
        localStorage.setItem('femaleStagEntryPrice', formData.femaleStagEntryPrice || '0');
        localStorage.setItem('groupEntryPrice', formData.groupEntryPrice || '0');

        toast({
            title: "Pricing Saved",
            description: "Entry pricing has been saved successfully",
        });

        router.back();
    };

    return (
        <div className="min-h-screen bg-[#031313]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-6">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all"
                >
                    <ArrowLeft className="text-white text-xl" />
                </button>
                <h1 className="text-white text-lg font-semibold">Entry Pricing</h1>
                <button
                    onClick={handleSave}
                    className="w-10 h-10 flex items-center justify-center bg-[#0D7377] hover:bg-[#0A5A5D] rounded-full transition-all"
                >
                    <Save className="text-white" />
                </button>
            </div>

            {/* Form Content */}
            <div className="px-4 py-6 space-y-6">
                {/* Couple Entry Price */}
                <div className="space-y-2">
                    <label className="text-[#14FFEC] font-semibold text-base">Couple Entry Price (₹)</label>
                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-[10px] px-5">
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-transparent text-white outline-none font-semibold"
                            value={formData.coupleEntryPrice !== undefined ? formData.coupleEntryPrice : ''}
                            onChange={(e) => handleNumberChange('coupleEntryPrice', e.target.value)}
                        />
                    </div>
                </div>

                {/* Male Stag Entry Price */}
                <div className="space-y-2">
                    <label className="text-[#14FFEC] font-semibold text-base">Male Stag Entry Price (₹)</label>
                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-[10px] px-5">
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-transparent text-white outline-none font-semibold"
                            value={formData.maleStagEntryPrice !== undefined ? formData.maleStagEntryPrice : ''}
                            onChange={(e) => handleNumberChange('maleStagEntryPrice', e.target.value)}
                        />
                    </div>
                </div>

                {/* Female Stag Entry Price */}
                <div className="space-y-2">
                    <label className="text-[#14FFEC] font-semibold text-base">Female Stag Entry Price (₹)</label>
                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-[10px] px-5">
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-transparent text-white outline-none font-semibold"
                            value={formData.femaleStagEntryPrice !== undefined ? formData.femaleStagEntryPrice : ''}
                            onChange={(e) => handleNumberChange('femaleStagEntryPrice', e.target.value)}
                        />
                    </div>
                </div>

                {/* Group Entry Price */}
                <div className="space-y-2">
                    <label className="text-[#14FFEC] font-semibold text-base">Group Entry Price (₹)</label>
                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-[10px] px-5">
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-transparent text-white outline-none font-semibold"
                            value={formData.groupEntryPrice !== undefined ? formData.groupEntryPrice : ''}
                            onChange={(e) => handleNumberChange('groupEntryPrice', e.target.value)}
                        />
                    </div>
                </div>

                {/* Cover Charge */}
                <div className="space-y-2">
                    <label className="text-[#14FFEC] font-semibold text-base">Cover Charge (₹)</label>
                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-[10px] px-5">
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-transparent text-white outline-none font-semibold"
                            value={formData.coverCharge !== undefined ? formData.coverCharge : ''}
                            onChange={(e) => handleNumberChange('coverCharge', e.target.value)}
                        />
                    </div>
                </div>

                {/* Redeem Details */}
                <div className="space-y-2">
                    <label className="text-[#14FFEC] font-semibold text-base">Redeem Details</label>
                    <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-lg p-[10px] px-5">
                        <textarea
                            className="w-full bg-transparent text-white outline-none font-semibold min-h-[60px]"
                            value={formData.redeemDetails}
                            onChange={(e) => handleInputChange('redeemDetails', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
