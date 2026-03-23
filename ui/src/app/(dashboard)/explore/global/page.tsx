'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import GlobalQueryExplorer from '@/components/explore/GlobalQueryExplorer';

export default function GlobalQueryPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-full">
            {/* Header with back button */}
            <div className="shrink-0 px-6 pt-4">
                <button
                    onClick={() => router.push('/explore')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Explore
                </button>
            </div>
            <div className="flex-1 overflow-auto px-6 pb-6">
                <GlobalQueryExplorer />
            </div>
        </div>
    );
}
