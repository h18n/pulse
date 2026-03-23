"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VariableModel, useDashboardStore } from '@/stores/dashboardStore';

interface VariableBarProps {
    className?: string;
}

export function VariableBar({ className }: VariableBarProps) {
    const { currentDashboard: dashboard, variableValues, setVariableValue } = useDashboardStore();
    const variables = dashboard?.templating?.list || [];

    if (variables.length === 0) return null;

    return (
        <div className={cn("flex items-center gap-3 flex-wrap", className)}>
            {variables.map((variable) => {
                if (variable.hide === 2) return null;

                return (
                    <VariableDropdown
                        key={variable.name}
                        variable={variable}
                        value={variableValues[variable.name]}
                        onChange={(value) => setVariableValue(variable.name, value)}
                    />
                );
            })}
        </div>
    );
}

interface VariableDropdownProps {
    variable: VariableModel;
    value: string | string[] | undefined;
    onChange: (value: string | string[]) => void;
}

function VariableDropdown({ variable, value, onChange }: VariableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const options = variable.options || [];
    const filteredOptions = options.filter(opt =>
        opt.text.toLowerCase().includes(search.toLowerCase())
    );

    const displayValue = () => {
        if (!value) return 'Select...';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'Select...';
            if (value.includes('$__all') || value.length === options.length) return 'All';
            if (value.length === 1) return value[0];
            return `${value.length} selected`;
        }
        return String(value);
    };

    const isSelected = (optValue: string | string[]) => {
        if (Array.isArray(value)) {
            return Array.isArray(optValue)
                ? optValue.every(v => value.includes(v))
                : value.includes(optValue);
        }
        return value === optValue;
    };

    const handleSelect = (optValue: string | string[]) => {
        if (variable.multi) {
            const currentValues = Array.isArray(value) ? value : value ? [value] : [];
            const optValueStr = Array.isArray(optValue) ? optValue[0] : optValue;

            if (optValueStr === '$__all') {
                onChange(['$__all']);
            } else {
                const newValues = currentValues.filter(v => v !== '$__all');
                if (newValues.includes(optValueStr)) {
                    onChange(newValues.filter(v => v !== optValueStr));
                } else {
                    onChange([...newValues, optValueStr]);
                }
            }
        } else {
            onChange(Array.isArray(optValue) ? optValue[0] : optValue);
            setIsOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(variable.multi ? [] : '');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Label */}
            {variable.hide !== 1 && (
                <label className="text-xs text-muted-foreground mr-2">
                    {variable.label || variable.name}:
                </label>
            )}

            {/* Dropdown Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "inline-flex items-center gap-2 bg-muted hover:bg-muted/80 border border-border rounded-lg px-3 py-1.5 text-sm transition-colors min-w-[120px]",
                    isOpen && "ring-1 ring-primary"
                )}
            >
                <span className="flex-1 text-left truncate max-w-[150px]">{displayValue()}</span>
                {value && (Array.isArray(value) ? value.length > 0 : value) && (
                    <X
                        size={12}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        onClick={handleClear}
                    />
                )}
                <ChevronDown size={14} className={cn("text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden">
                    {/* Search */}
                    {options.length > 10 && (
                        <div className="p-2 border-b border-border">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full bg-muted border-none rounded-lg pl-8 pr-3 py-1.5 text-sm focus:ring-1 ring-primary focus:outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="max-h-64 overflow-y-auto py-1">
                        {variable.includeAll && (
                            <button
                                onClick={() => handleSelect('$__all')}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                                    isSelected('$__all') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                )}
                            >
                                {variable.multi && (
                                    <div className={cn(
                                        "w-4 h-4 border rounded flex items-center justify-center",
                                        isSelected('$__all') ? "bg-primary border-primary" : "border-border"
                                    )}>
                                        {isSelected('$__all') && <Check size={10} className="text-primary-foreground" />}
                                    </div>
                                )}
                                <span>All</span>
                            </button>
                        )}

                        {filteredOptions.map((opt) => (
                            <button
                                key={String(opt.value)}
                                onClick={() => handleSelect(opt.value)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                                    isSelected(opt.value) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                )}
                            >
                                {variable.multi && (
                                    <div className={cn(
                                        "w-4 h-4 border rounded flex items-center justify-center shrink-0",
                                        isSelected(opt.value) ? "bg-primary border-primary" : "border-border"
                                    )}>
                                        {isSelected(opt.value) && <Check size={10} className="text-primary-foreground" />}
                                    </div>
                                )}
                                <span className="truncate">{opt.text}</span>
                            </button>
                        ))}

                        {filteredOptions.length === 0 && (
                            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                                No options found
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VariableBar;
