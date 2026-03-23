'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md'
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Handle click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
            data-testid="modal-backdrop"
        >
            <div
                ref={modalRef}
                className={cn(
                    "w-full bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-200",
                    sizeClasses[size]
                )}
                role="dialog"
                aria-modal="true"
                data-testid="modal"
            >
                {/* Header */}
                {(title || description) && (
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex items-center justify-between">
                            {title && <h2 className="text-lg font-semibold">{title}</h2>}
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-muted rounded-lg transition-colors"
                                data-testid="modal-close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                )}

                {/* Content */}
                {children}
            </div>
        </div>
    );
}

// Confirmation Dialog
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
            <div className="px-6 py-4 flex items-center justify-end gap-3">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50"
                    data-testid="confirm-cancel"
                >
                    {cancelLabel}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                        variant === 'destructive'
                            ? "bg-destructive text-white hover:opacity-90"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                    )}
                    data-testid="confirm-action"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Loading...
                        </span>
                    ) : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
