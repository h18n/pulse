"use client";

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { WidgetProps } from '../registry';

export function TextWidget({ panel }: WidgetProps) {
    const options = panel.options || {};
    const content = String(options.content || '');
    const mode = options.mode || 'markdown';

    // Simple markdown parser
    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            // Headers
            if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-lg font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>;
            }
            if (line.startsWith('# ')) {
                return <h1 key={idx} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
            }

            // Lists
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={idx} className="ml-4 list-disc">{line.slice(2)}</li>;
            }

            // Code
            if (line.startsWith('```')) {
                return null;
            }

            // Inline formatting
            let formatted = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>');

            // Empty lines
            if (line.trim() === '') {
                return <br key={idx} />;
            }

            return (
                <p
                    key={idx}
                    className="mb-1"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }}
                />
            );
        });
    };

    return (
        <div className="w-full h-full p-4 overflow-auto prose prose-invert prose-sm max-w-none">
            {mode === 'markdown' ? (
                renderMarkdown(content)
            ) : (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
            )}
        </div>
    );
}

export default TextWidget;
