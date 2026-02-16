'use client';

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/app/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, helperText, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'input-field',
                            icon && 'pr-10',
                            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-danger-500">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-slate-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
