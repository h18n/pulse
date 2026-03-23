'use client';

/**
 * Widget Comments Component
 * 
 * Displays a list of contextual comments for a specific dashboard widget.
 * Allows users to add new comments and @mention teammates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare,
    Send,
    Trash2,
    User,
    Clock,
    Loader2,
    AlertCircle,
    AtSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
    id: string;
    resourceId: string;
    userName: string;
    text: string;
    createdAt: string;
}

interface WidgetCommentsProps {
    widgetId: string;
    className?: string;
}

export function WidgetComments({ widgetId, className }: WidgetCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/ai-engine/comments/${widgetId}`);
            if (!res.ok) throw new Error('Failed to load comments');
            const data = await res.json();
            setComments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [widgetId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSend = async () => {
        if (!newComment.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch('/api/ai-engine/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resourceId: widgetId,
                    resourceType: 'widget',
                    userId: 'user-123', // Mock user
                    userName: 'Haris',
                    text: newComment
                })
            });

            if (!res.ok) throw new Error('Failed to post comment');
            const savedComment = await res.json();

            setComments(prev => [...prev, savedComment]);
            setNewComment('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/ai-engine/comments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setComments(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className={cn("flex flex-col h-full bg-card/50 backdrop-blur-sm border rounded-xl overflow-hidden shadow-2xl", className)}>
            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" />
                    <h3 className="font-bold text-sm tracking-tight">Collaboration</h3>
                </div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {comments.length} Comments
                </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 grayscale">
                        <MessageSquare size={48} strokeWidth={1} />
                        <p className="text-xs mt-2 font-medium">No discussions yet.</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                    <User size={14} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-bold text-primary truncate">{comment.userName}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="text-destructive hover:scale-110 transition-transform"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-card border rounded-lg p-3 text-sm shadow-sm leading-relaxed">
                                        {comment.text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-muted/20">
                {error && (
                    <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded flex items-center gap-2 text-[10px] text-destructive font-medium">
                        <AlertCircle size={12} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto hover:underline">Dismiss</button>
                    </div>
                )}
                <div className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a thought or mention @teammate..."
                        className="w-full bg-card border rounded-xl p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px] resize-none transition-all placeholder:text-muted-foreground/50"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 opacity-50">
                        <AtSign size={14} className="hover:text-primary cursor-pointer transition-colors" />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !newComment.trim()}
                        className={cn(
                            "absolute bottom-3 right-3 p-2 rounded-lg transition-all",
                            newComment.trim() ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 rotate-0" : "bg-muted text-muted-foreground rotate-45"
                        )}
                    >
                        {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
