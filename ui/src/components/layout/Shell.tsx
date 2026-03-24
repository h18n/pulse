"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Bell,
    Settings,
    Search,
    ShieldCheck,
    Bot,
    Menu,
    Server,
    LogOut,
    User,
    ChevronDown,
    ChevronLeft,
    LayoutGrid,
    Compass,
    Moon,
    Sun,
    Monitor,
    X,
    Flame,
    Activity,
    Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';

const NAV_ITEMS = [
    { href: '/dashboards', icon: LayoutDashboard, label: 'Dashboards' },
    {
        href: '/explore', icon: Compass, label: 'Explore', children: [
            { href: '/explore', label: 'Overview' },
            { href: '/explore/logs', label: 'Logs' },
            { href: '/explore/metrics', label: 'Metrics' },
        ]
    },
    {
        href: '/alerts', icon: Bell, label: 'Alerts', children: [
            { href: '/alerts', label: 'Active Alerts' },
            { href: '/alerts/rules', label: 'Alert Rules' },
            { href: '/alerts/channels', label: 'Notification Channels' },
        ]
    },
    { href: '/incidents', icon: Flame, label: 'Incidents' },
    { href: '/devices', icon: Server, label: 'Devices' },
    { href: '/copilot', icon: Bot, label: 'AI Copilot' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setIsThemeMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load sidebar state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebarOpen');
        if (savedState !== null) {
            setIsSidebarOpen(savedState === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', String(newState));
    };

    const userRole = session?.user?.role || 'viewer';

    const filteredNavItems = NAV_ITEMS.filter(item => {
        const roles = (item as { roles?: string[] }).roles;
        if (!roles) return true;
        return roles.includes(userRole);
    });

    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' });
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-destructive/10 text-destructive border-destructive/20';
            case 'editor': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const themeIcon = theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />;

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out z-50",
                // Desktop behavior
                "hidden md:flex",
                isSidebarOpen ? "w-64" : "w-16",
                // Mobile behavior  
                isMobileSidebarOpen && "fixed inset-y-0 left-0 w-64 flex md:hidden"
            )}>
                {/* Logo */}
                <div className={cn(
                    "p-4 flex items-center gap-3 border-b border-border",
                    !isSidebarOpen && "justify-center"
                )}>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                        <Activity className="text-white" size={18} strokeWidth={2.5} />
                    </div>
                    {isSidebarOpen && (
                        <span className="font-bold text-xl tracking-tight text-foreground">PULSE</span>
                    )}
                    {/* Mobile close button */}
                    <button
                        className="ml-auto p-1 hover:bg-muted rounded md:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {filteredNavItems.map(item => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={<item.icon size={20} />}
                            label={item.label}
                            active={pathname === item.href || (item.children && pathname?.startsWith(item.href))}
                            children={item.children}
                            pathname={pathname}
                            collapsed={!isSidebarOpen}
                        />
                    ))}
                </nav>

                <div className="p-2 border-t border-border">
                    <NavItem
                        href="/settings"
                        icon={<Settings size={20} />}
                        label="System Settings"
                        active={pathname === '/settings'}
                        collapsed={!isSidebarOpen}
                    />
                </div>

                {/* Collapse Button - Desktop only */}
                <button
                    onClick={toggleSidebar}
                    aria-label="Toggle Sidebar"
                    className="hidden md:flex items-center justify-center p-2 m-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft size={18} className={cn("transition-transform", !isSidebarOpen && "rotate-180")} />
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm z-10 shrink-0">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Mobile menu button */}
                        <button
                            className="p-2 hover:bg-muted rounded-lg md:hidden"
                            onClick={() => setIsMobileSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>

                        {/* Desktop sidebar toggle */}
                        <button
                            className="p-2 hover:bg-muted rounded-lg hidden md:block"
                            onClick={toggleSidebar}
                        >
                            <Menu size={20} />
                        </button>

                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                placeholder="Search..."
                                className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Region indicator */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            US-EAST
                        </div>

                        {/* Theme Menu */}
                        <div className="relative" ref={themeMenuRef}>
                            <button
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                aria-label="Theme Menu"
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                {themeIcon}
                            </button>

                            {isThemeMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-36 bg-card border border-border rounded-lg shadow-2xl z-[9999] overflow-hidden">
                                    <button
                                        onClick={() => { setTheme('light'); setIsThemeMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                                            theme === 'light' && "text-primary bg-primary/5"
                                        )}
                                    >
                                        <Sun size={14} />
                                        Light
                                    </button>
                                    <button
                                        onClick={() => { setTheme('dark'); setIsThemeMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                                            theme === 'dark' && "text-primary bg-primary/5"
                                        )}
                                    >
                                        <Moon size={14} />
                                        Dark
                                    </button>
                                    <button
                                        onClick={() => { setTheme('system'); setIsThemeMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                                            theme === 'system' && "text-primary bg-primary/5"
                                        )}
                                    >
                                        <Monitor size={14} />
                                        System
                                    </button>
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => { setTheme('cerulean'); setIsThemeMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                                            theme === 'cerulean' && "text-blue-500 bg-blue-500/5"
                                        )}
                                    >
                                        <Circle size={10} fill="currentColor" className="text-blue-500" />
                                        Cerulean
                                    </button>
                                    <button
                                        onClick={() => { setTheme('violet'); setIsThemeMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                                            theme === 'violet' && "text-violet-500 bg-violet-500/5"
                                        )}
                                    >
                                        <Circle size={10} fill="currentColor" className="text-violet-500" />
                                        Violet
                                    </button>
                                    <button
                                        onClick={() => { setTheme('amber'); setIsThemeMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                                            theme === 'amber' && "text-amber-500 bg-amber-500/5"
                                        )}
                                    >
                                        <Circle size={10} fill="currentColor" className="text-amber-500" />
                                        Amber
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Notifications */}
                        <button className="p-2 hover:bg-muted rounded-lg relative">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                        </button>

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 p-1 hover:bg-muted rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <ChevronDown size={14} className={cn("text-muted-foreground transition-transform hidden sm:block", isUserMenuOpen && "rotate-180")} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden">
                                    {/* User Info */}
                                    <div className="p-4 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-medium">
                                                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{session?.user?.name || 'User'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border capitalize",
                                                getRoleBadgeColor(userRole)
                                            )}>
                                                {userRole}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                                            <User size={16} />
                                            Profile Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Viewport */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({
    href,
    icon,
    label,
    active = false,
    children,
    pathname,
    collapsed = false
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    children?: Array<{ href: string; label: string }>;
    pathname?: string;
    collapsed?: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = children && children.length > 0;
    const isChildActive = hasChildren && children.some(child => pathname === child.href);

    // Auto-expand if a child is active
    useEffect(() => {
        if (isChildActive) {
            setIsExpanded(true);
        }
    }, [isChildActive]);

    // Collapsed view - just show icon
    if (collapsed) {
        return (
            <Link
                href={href}
                title={label}
                className={cn(
                    "flex items-center justify-center p-2.5 rounded-lg transition-all",
                    active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                {icon}
            </Link>
        );
    }

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        (active || isChildActive)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {icon}
                    <span className="flex-1 text-left">{label}</span>
                    <ChevronDown
                        size={14}
                        className={cn(
                            "transition-transform",
                            isExpanded && "rotate-180"
                        )}
                    />
                </button>
                {isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border pl-4">
                        {children.map(child => (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                    "block px-3 py-2 rounded-md text-sm transition-colors",
                                    pathname === child.href
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {child.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            {icon}
            {label}
        </Link>
    );
}
