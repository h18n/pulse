"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Terminal,
    Search,
    Zap,
    Copy,
    Check,
    RefreshCw,
    ChevronRight,
    MessageSquare,
    History,
    Trash2,
    Plus,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    codeBlock?: { language: string; code: string };
    chart?: { type: string; data: any[] };
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

const QUICK_ACTIONS = [
    { id: 'anomaly', icon: AlertTriangle, label: 'Detect Anomalies', prompt: 'Analyze the last hour of metrics and identify any anomalies or unusual patterns.' },
    { id: 'query', icon: Terminal, label: 'Build Query', prompt: 'Help me build a PromQL query for ' },
    { id: 'explain', icon: Lightbulb, label: 'Explain Alert', prompt: 'Explain why this alert might be firing and suggest remediation steps: ' },
    { id: 'optimize', icon: Zap, label: 'Optimize Query', prompt: 'Optimize this PromQL query for better performance: ' },
    { id: 'investigate', icon: Search, label: 'Investigate Issue', prompt: 'Help me investigate high latency in the checkout service.' },
    { id: 'trends', icon: TrendingUp, label: 'Analyze Trends', prompt: 'Analyze CPU and memory usage trends over the past 24 hours.' },
];

const SAMPLE_CONVERSATIONS: Conversation[] = [
    {
        id: '1',
        title: 'High CPU Investigation',
        messages: [],
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 3600000),
    },
    {
        id: '2',
        title: 'Memory Leak Analysis',
        messages: [],
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 86400000),
    },
];

export default function CopilotPage() {
    const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Try real AI response
        try {
            const response = await fetch('/api/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMessage.content }),
            });

            if (!response.ok) throw new Error('AI Engine failed');
            const data = await response.json();

            const assistantMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: data.answer || data.analysis?.rootCause || "I'm sorry, I couldn't process that.",
                timestamp: new Date(),
                suggestions: data.analysis?.remediation || ['Show alerts', 'Investigate further'],
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Copilot error, falling back to mock:', error);
            const assistantMessage = generateResponse(userMessage.content);
            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickAction = (prompt: string) => {
        setInput(prompt);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const startNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
    };

    return (
        <div className="flex h-full">
            {/* Sidebar - Conversation History */}
            {showHistory && (
                <div className="w-72 border-r border-border bg-card/50 flex flex-col">
                    <div className="p-4 border-b border-border">
                        <button
                            onClick={startNewConversation}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} />
                            New Chat
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-2">
                        <p className="px-2 py-1 text-xs text-muted-foreground font-medium uppercase">Recent</p>
                        {conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => setCurrentConversation(conv)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1",
                                    currentConversation?.id === conv.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={14} />
                                    <span className="truncate">{conv.title}</span>
                                </div>
                                <span className="text-xs opacity-60">
                                    {conv.updatedAt.toLocaleDateString()}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-border">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                            <Settings size={14} />
                            Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">AI Copilot</h1>
                                <p className="text-sm text-muted-foreground">
                                    Your intelligent observability assistant
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    showHistory ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <History size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-auto">
                    {messages.length === 0 ? (
                        <WelcomeScreen onQuickAction={handleQuickAction} />
                    ) : (
                        <div className="max-w-4xl mx-auto p-6 space-y-6">
                            {messages.map(message => (
                                <MessageBubble key={message.id} message={message} />
                            ))}
                            {isTyping && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="shrink-0 border-t border-border bg-card/50 p-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative flex items-end gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything about your infrastructure..."
                                    rows={1}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 ring-primary focus:outline-none resize-none min-h-[48px] max-h-[200px]"
                                    style={{ height: 'auto' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className={cn(
                                        "absolute right-2 bottom-2 p-2 rounded-lg transition-all",
                                        input.trim() && !isTyping
                                            ? "bg-primary text-primary-foreground hover:opacity-90"
                                            : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            AI Copilot can make mistakes. Verify important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============== Components ==============

function WelcomeScreen({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                <Sparkles size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
                I can help you investigate issues, build queries, analyze metrics, and more.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl">
                {QUICK_ACTIONS.map(action => (
                    <button
                        key={action.id}
                        onClick={() => onQuickAction(action.prompt)}
                        className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
                    >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <action.icon size={18} className="text-primary" />
                        </div>
                        <span className="text-sm font-medium">{action.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-12 text-center">
                <p className="text-xs text-muted-foreground mb-4">Example queries</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                    {[
                        "Why is my API latency high?",
                        "Show me error rates by service",
                        "Create a dashboard for database metrics",
                        "Explain this PromQL query",
                    ].map(example => (
                        <button
                            key={example}
                            onClick={() => onQuickAction(example)}
                            className="px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: Message }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isUser = message.role === 'user';

    return (
        <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isUser ? "bg-primary" : "bg-gradient-to-br from-violet-500 to-purple-600"
            )}>
                {isUser ? (
                    <User size={16} className="text-primary-foreground" />
                ) : (
                    <Bot size={16} className="text-white" />
                )}
            </div>

            <div className={cn("flex-1 max-w-[80%]", isUser && "text-right")}>
                <div className={cn(
                    "inline-block p-4 rounded-2xl text-sm",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border rounded-bl-md"
                )}>
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {message.codeBlock && (
                        <div className="mt-3 relative">
                            <pre className="p-3 bg-background rounded-lg overflow-x-auto text-xs font-mono">
                                <code>{message.codeBlock.code}</code>
                            </pre>
                            <button
                                onClick={() => handleCopy(message.codeBlock!.code)}
                                className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
                            >
                                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                        </div>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Suggested actions:</p>
                            <div className="flex flex-wrap gap-2">
                                {message.suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        className="px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md p-4">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

// ============== Response Generation ==============

function generateResponse(userMessage: string): Message {
    const lowerMessage = userMessage.toLowerCase();

    let content = '';
    let suggestions: string[] = [];
    let codeBlock: { language: string; code: string } | undefined;

    if (lowerMessage.includes('anomal') || lowerMessage.includes('unusual')) {
        content = `I've analyzed the last hour of metrics data and found the following anomalies:

**1. CPU Spike on prod-server-03**
- Peak: 94.5% at 16:45
- Normal baseline: 35-45%
- Correlation: High number of concurrent connections

**2. Memory Pressure on db-primary**
- Current: 87.2% (above 85% threshold)
- Trend: Increasing 2% per hour
- Recommendation: Consider scaling or investigating memory leaks

**3. Elevated Error Rate in checkout-service**
- Current: 2.3% (normal: <0.5%)
- Started: 15 minutes ago
- Most common error: Connection timeout to payment gateway

Would you like me to create alerts for these anomalies or investigate any of them further?`;
        suggestions = ['Create alert rules', 'Show error logs', 'View related metrics'];
    } else if (lowerMessage.includes('query') || lowerMessage.includes('promql')) {
        content = `Here's a PromQL query that might help:`;
        codeBlock = {
            language: 'promql',
            code: `# HTTP request rate by status code
sum(rate(http_requests_total[5m])) by (status_code)

# P95 latency
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)`
        };
        content += `\n\nThis query will show you the HTTP request rate grouped by status code over a 5-minute window. You can adjust the time range or add additional labels for filtering.`;
        suggestions = ['Execute query', 'Add to dashboard', 'Modify filters'];
    } else if (lowerMessage.includes('latency') || lowerMessage.includes('slow')) {
        content = `Based on recent data, I've identified potential causes for high latency:

**Root Cause Analysis:**
1. **Database Connection Pool Saturation** (High Confidence)
   - Connection pool at 92% capacity
   - Average query time increased by 3x
   
2. **Increased Traffic** (Medium Confidence)
   - Request volume up 40% compared to yesterday
   - No auto-scaling triggered

3. **External API Delays** (Low Confidence)  
   - Payment gateway P95 latency: 800ms (normal: 200ms)

**Recommended Actions:**
1. Scale the database connection pool
2. Review auto-scaling policies
3. Implement circuit breaker for payment gateway calls`;
        suggestions = ['View connection pool metrics', 'Adjust auto-scaling', 'Show traffic analysis'];
    } else if (lowerMessage.includes('alert') || lowerMessage.includes('firing')) {
        content = `I can help you understand why alerts are firing. Here's a quick analysis:

The **HighCPUUsage** alert is firing because:
- Current value: 94.5% (threshold: 90%)
- Duration: 45 minutes (for condition: 5m)
- Affected instances: prod-server-01, prod-server-03

**Possible Causes:**
1. Runaway process consuming CPU
2. Traffic spike without auto-scaling
3. Resource-intensive background job

**Quick Actions:**
- Run \`top\` on affected instances
- Check recent deployments
- Review cron job schedules`;
        suggestions = ['View alert history', 'Silence for 1 hour', 'View runbook'];
    } else {
        content = `I understand you're asking about "${userMessage}". 

Let me help you with that. I can:
- **Analyze metrics** to identify trends and anomalies
- **Build queries** for Prometheus/Loki
- **Investigate issues** across your infrastructure
- **Explain alerts** and suggest remediations
- **Create dashboards** for monitoring

Could you provide more context about what you'd like to accomplish? For example:
- Which services are affected?
- What time range should I look at?
- Are there any specific metrics you're interested in?`;
        suggestions = ['Show recent alerts', 'View system status', 'Analyze last hour'];
    }

    return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        suggestions,
        codeBlock,
    };
}
