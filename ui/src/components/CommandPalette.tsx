'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Command,
    LayoutDashboard,
    Bell,
    AlertTriangle,
    FileText,
    BarChart3,
    Server,
    Bot,
    Settings,
    Moon,
    Sun,
    Monitor,
    LogOut,
    Plus,
    Clock,
    Zap,
    Shield,
    Hash,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';
import { signOut } from 'next-auth/react';

interface CommandItem {
    id: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    category: 'navigation' | 'actions' | 'theme' | 'recent';
    action: () => void;
    keywords?: string[];
    shortcut?: string;
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { setTheme, theme } = useTheme();

    // Define all available commands
    const commands: CommandItem[] = useMemo(() => [
        // Navigation
        {
            id: 'nav-dashboard',
            title: 'Go to Dashboards',
            description: 'View all dashboards',
            icon: <LayoutDashboard size={18} />,
            category: 'navigation',
            action: () => router.push('/'),
            keywords: ['home', 'main', 'overview'],
            shortcut: 'G D',
        },
        {
            id: 'nav-builder',
            title: 'Go to Dashboard Builder',
            description: 'Create custom dashboards',
            icon: <Plus size={18} />,
            category: 'navigation',
            action: () => router.push('/builder'),
            keywords: ['create', 'new', 'widget'],
            shortcut: 'G B',
        },
        {
            id: 'nav-logs',
            title: 'Go to Logs Explorer',
            description: 'Search and analyze logs',
            icon: <FileText size={18} />,
            category: 'navigation',
            action: () => router.push('/explore/logs'),
            keywords: ['search', 'log', 'debug'],
            shortcut: 'G L',
        },
        {
            id: 'nav-metrics',
            title: 'Go to Metrics Explorer',
            description: 'Query and visualize metrics',
            icon: <BarChart3 size={18} />,
            category: 'navigation',
            action: () => router.push('/explore/metrics'),
            keywords: ['prometheus', 'promql', 'chart', 'graph'],
            shortcut: 'G M',
        },
        {
            id: 'nav-alerts',
            title: 'Go to Active Alerts',
            description: 'View firing alerts',
            icon: <Bell size={18} />,
            category: 'navigation',
            action: () => router.push('/alerts'),
            keywords: ['warning', 'error', 'notification'],
            shortcut: 'G A',
        },
        {
            id: 'nav-alert-rules',
            title: 'Go to Alert Rules',
            description: 'Manage alert configurations',
            icon: <Shield size={18} />,
            category: 'navigation',
            action: () => router.push('/alerts/rules'),
            keywords: ['configure', 'threshold'],
        },
        {
            id: 'nav-incidents',
            title: 'Go to Incidents',
            description: 'View and manage incidents',
            icon: <AlertTriangle size={18} />,
            category: 'navigation',
            action: () => router.push('/incidents'),
            keywords: ['outage', 'issue', 'problem'],
            shortcut: 'G I',
        },
        {
            id: 'nav-devices',
            title: 'Go to Devices',
            description: 'Monitor infrastructure',
            icon: <Server size={18} />,
            category: 'navigation',
            action: () => router.push('/devices'),
            keywords: ['server', 'host', 'infra'],
        },
        {
            id: 'nav-service-map',
            title: 'Go to Service Map',
            description: 'View service topology',
            icon: <Hash size={18} />,
            category: 'navigation',
            action: () => router.push('/devices/service-map'),
            keywords: ['topology', 'dependencies'],
        },
        {
            id: 'nav-copilot',
            title: 'Go to AI Copilot',
            description: 'Chat with AI assistant',
            icon: <Bot size={18} />,
            category: 'navigation',
            action: () => router.push('/copilot'),
            keywords: ['ai', 'chat', 'help', 'assistant'],
            shortcut: 'G C',
        },
        // Actions
        {
            id: 'action-new-dashboard',
            title: 'Create New Dashboard',
            description: 'Start building a new dashboard',
            icon: <Plus size={18} />,
            category: 'actions',
            action: () => router.push('/builder'),
            keywords: ['new', 'create'],
        },
        {
            id: 'action-new-alert',
            title: 'Create Alert Rule',
            description: 'Configure a new alert',
            icon: <Zap size={18} />,
            category: 'actions',
            action: () => router.push('/alerts/rules?new=true'),
            keywords: ['new', 'create', 'threshold'],
        },
        {
            id: 'action-refresh',
            title: 'Refresh Data',
            description: 'Reload current page data',
            icon: <Clock size={18} />,
            category: 'actions',
            action: () => window.location.reload(),
            keywords: ['reload', 'update'],
            shortcut: '⌘ R',
        },
        {
            id: 'action-logout',
            title: 'Sign Out',
            description: 'Log out of your account',
            icon: <LogOut size={18} />,
            category: 'actions',
            action: () => signOut({ callbackUrl: '/login' }),
            keywords: ['logout', 'exit'],
        },
        // Theme
        {
            id: 'theme-light',
            title: 'Switch to Light Theme',
            description: 'Use light color scheme',
            icon: <Sun size={18} />,
            category: 'theme',
            action: () => setTheme('light'),
            keywords: ['mode', 'bright'],
        },
        {
            id: 'theme-dark',
            title: 'Switch to Dark Theme',
            description: 'Use dark color scheme',
            icon: <Moon size={18} />,
            category: 'theme',
            action: () => setTheme('dark'),
            keywords: ['mode', 'night'],
        },
        {
            id: 'theme-system',
            title: 'Use System Theme',
            description: 'Follow system preference',
            icon: <Monitor size={18} />,
            category: 'theme',
            action: () => setTheme('system'),
            keywords: ['mode', 'auto'],
        },
    ], [router, setTheme]);

    // Filter commands based on search
    const filteredCommands = useMemo(() => {
        if (!search) return commands;

        const searchLower = search.toLowerCase();
        return commands.filter(cmd => {
            const titleMatch = cmd.title.toLowerCase().includes(searchLower);
            const descMatch = cmd.description?.toLowerCase().includes(searchLower);
            const keywordMatch = cmd.keywords?.some(k => k.includes(searchLower));
            return titleMatch || descMatch || keywordMatch;
        });
    }, [commands, search]);

    // Group commands by category
    const groupedCommands = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {
            navigation: [],
            actions: [],
            theme: [],
        };

        filteredCommands.forEach(cmd => {
            if (groups[cmd.category]) {
                groups[cmd.category].push(cmd);
            }
        });

        return groups;
    }, [filteredCommands]);

    // Keyboard shortcut to open palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const totalItems = filteredCommands.length;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % totalItems);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    executeCommand(filteredCommands[selectedIndex]);
                }
                break;
        }
    }, [filteredCommands, selectedIndex]);

    // Execute command and close palette
    const executeCommand = (cmd: CommandItem) => {
        setIsOpen(false);
        cmd.action();
    };

    // Scroll selected item into view
    useEffect(() => {
        const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
        selectedElement?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    if (!isOpen) return null;

    const categoryLabels: Record<string, string> = {
        navigation: 'Navigation',
        actions: 'Actions',
        theme: 'Theme',
    };

    let globalIndex = 0;

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Command Palette */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
                <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        <Search size={20} className="text-muted-foreground shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                        />
                        <kbd className="hidden sm:block px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded">
                            ESC
                        </kbd>
                    </div>

                    {/* Command List */}
                    <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                        {filteredCommands.length === 0 ? (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                                <Search size={40} className="mx-auto mb-2 opacity-50" />
                                <p>No commands found</p>
                                <p className="text-sm">Try a different search term</p>
                            </div>
                        ) : (
                            Object.entries(groupedCommands).map(([category, items]) => {
                                if (items.length === 0) return null;

                                return (
                                    <div key={category} className="mb-2">
                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {categoryLabels[category]}
                                        </div>
                                        {items.map((cmd) => {
                                            const currentIndex = globalIndex++;
                                            const isSelected = currentIndex === selectedIndex;

                                            return (
                                                <button
                                                    key={cmd.id}
                                                    data-index={currentIndex}
                                                    onClick={() => executeCommand(cmd)}
                                                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                                        isSelected
                                                            ? "bg-primary/10 text-primary"
                                                            : "text-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "shrink-0",
                                                        isSelected ? "text-primary" : "text-muted-foreground"
                                                    )}>
                                                        {cmd.icon}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{cmd.title}</div>
                                                        {cmd.description && (
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                {cmd.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {cmd.shortcut && (
                                                        <kbd className="hidden sm:block px-1.5 py-0.5 text-xs font-mono text-muted-foreground bg-muted rounded">
                                                            {cmd.shortcut}
                                                        </kbd>
                                                    )}
                                                    {isSelected && (
                                                        <ArrowRight size={14} className="text-primary shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-muted rounded">↓</kbd>
                                <span>Navigate</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
                                <span>Select</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Command size={12} />
                            <span>K to toggle</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
