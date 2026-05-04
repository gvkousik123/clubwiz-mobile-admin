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
        <div className="relative w-full">
            <div className="relative">
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
            w-full py-4 px-5 rounded-full 
            bg-[rgba(42,42,42,0.7)]
            border border-white/10
            text-text-primary placeholder-text-tertiary
            focus:outline-none focus:border-primary-500/40 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.15)]
            transition-all duration-200
            ${isFocused ? 'border-primary-500/40' : 'border-white/10'}
            ${className}
          `}
                    style={{
                        boxShadow: isFocused ? '0 0 0 2px rgba(20,184,166,0.15)' : 'none',
                    }}
                />

                {/* Icon at the start if provided */}
                {icon && (
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary">
                        {icon}
                    </div>
                )}

                {/* Password toggle */}
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-primary-400 transition-colors"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
        </div>
    );
}