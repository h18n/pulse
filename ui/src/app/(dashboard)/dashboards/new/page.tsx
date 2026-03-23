'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function NewDashboardPage() {
    const router = useRouter();
    const { createDashboard } = useDashboardStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            const dashboard = await createDashboard({
                title: title.trim(),
                description: description.trim(),
            });
            // Navigate to the new dashboard in edit mode
            router.push(`/dashboards/${dashboard.id}?edit=true`);
        } catch (error) {
            console.error('Failed to create dashboard:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push('/dashboards')}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-2xl font-bold">New Dashboard</h1>
            </div>

            {/* Form */}
            <div className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:ring-2 ring-primary focus:outline-none"
                        placeholder="My Dashboard"
                        autoFocus
                        data-testid="dashboard-title-input"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:ring-2 ring-primary focus:outline-none resize-none"
                        rows={3}
                        placeholder="Optional description for your dashboard"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                    <button
                        onClick={() => router.push('/dashboards')}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim() || isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Create Dashboard
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
