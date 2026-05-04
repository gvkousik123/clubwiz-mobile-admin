import React from 'react';
import { X, ArrowRight } from 'lucide-react';

interface KeypadProps {
    onNumberPress: (num: number) => void;
    onDelete: () => void;
    onSubmit: () => void;
}

export function Keypad({ onNumberPress, onDelete, onSubmit }: KeypadProps) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="grid grid-cols-3 gap-4 w-full max-w-[300px] mx-auto mt-6">
            {numbers.map((num) => (
                <button
                    key={num}
                    onClick={() => onNumberPress(num)}
                    className="w-16 h-16 flex items-center justify-center rounded-full border border-primary-500/30 text-xl font-medium text-text-primary hover:bg-primary-500/10 transition-all duration-200 active:scale-95"
                    style={{
                        boxShadow: '0 0 10px rgba(20, 184, 166, 0.1)',
                    }}
                >
                    {num}
                </button>
            ))}
            <button
                onClick={onDelete}
                className="w-16 h-16 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-text-tertiary hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
                <X size={20} />
            </button>
            <button
                onClick={() => onNumberPress(0)}
                className="w-16 h-16 flex items-center justify-center rounded-full border border-primary-500/30 text-xl font-medium text-text-primary hover:bg-primary-500/10 transition-all duration-200 active:scale-95"
                style={{
                    boxShadow: '0 0 10px rgba(20, 184, 166, 0.1)',
                }}
            >
                0
            </button>
            <button
                onClick={onSubmit}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-button shadow-md text-xl text-text-primary font-medium hover:shadow-lg transition-all duration-300 active:scale-95"
                style={{
                    boxShadow: '0 4px 10px rgba(20, 184, 166, 0.3)',
                }}
            >
                <ArrowRight size={20} />
            </button>
        </div>
    );
}