import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthInputProps {
    type?: 'text' | 'email' | 'password' | 'tel';
    placeholder: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    required?: boolean;
    autoFocus?: boolean;
    error?: boolean;
}

export function AuthInput({
    type = 'text',
    placeholder,
    value,
    onChange,
    className = '',
    icon,
    disabled = false,
    required = false,
    autoFocus = false,
    error = false,
}: AuthInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [inputType, setInputType] = useState(type);
    const [isFocused, setIsFocused] = useState(false);

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
        setInputType(showPassword ? 'password' : 'text');
    };

    return (
        <div className="relative group w-full">
            {/* Icon at the start if provided */}
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#14FFEC] transition-colors z-10">
                    {icon}
                </div>
            )}

            <input
                type={type === 'password' ? inputType : type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                autoFocus={autoFocus}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`
                    w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'}
                    ${error ? 'focus:border-red-500' : 'focus:border-[#14FFEC]/50'} text-white rounded-2xl 
                    ${icon ? 'pl-12' : 'pl-4'} 
                    ${type === 'password' ? 'pr-12' : 'pr-4'} 
                    py-4 outline-none 
                    focus:bg-white/10 transition-all font-medium 
                    placeholder:text-white/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${className}
                `}
            />

            {/* Password toggle */}
            {type === 'password' && (
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors z-10"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            )}
        </div>
    );
}