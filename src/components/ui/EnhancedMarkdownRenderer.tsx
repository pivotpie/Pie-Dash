/**
 * Enhanced Markdown Renderer - Professional Analysis Display
 * Provides beautiful rendering of enhanced AI analysis responses
 */

import React from 'react';

interface EnhancedMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Convert markdown to HTML with enhanced styling for analysis reports
 */
const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  return markdown
    // Headers with enhanced styling
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-6 text-blue-900 border-b-2 border-blue-200 pb-3 flex items-center"><span class="text-2xl mr-2">📊</span>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-4 mt-8 text-gray-800 border-l-4 border-blue-500 pl-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-3 mt-6 text-gray-700">$1</h3>')

    // Enhanced table parsing - handle complete markdown tables
    .replace(/(?:^\|.*\|$\n?)+/gm, (tableMatch) => {
      // Split into rows and filter out empty ones
      const rows = tableMatch.trim().split('\n').filter(row => row.trim());

      if (rows.length < 2) return tableMatch; // Not a valid table

      let tableHtml = '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border border-gray-300 rounded-lg shadow-sm">';

      // Find the separator row (if any) to determine header vs data rows
      const separatorIndex = rows.findIndex(row => {
        const content = row.slice(1, -1);
        const cells = content.split('|').map(cell => cell.trim());
        return cells.every(cell => cell.match(/^-+:?:?-*$/));
      });

      rows.forEach((row, index) => {
        const content = row.slice(1, -1); // Remove outer pipes
        const cells = content.split('|').map(cell => cell.trim());

        // Check if this is a header separator row
        if (cells.every(cell => cell.match(/^-+:?:?-*$/))) {
          return; // Skip separator rows
        }

        // Rows before separator are headers, rows after are data
        // If no separator, first row is header
        const isHeader = separatorIndex >= 0 ? (index < separatorIndex) : (index === 0);

        const cellTag = isHeader ? 'th' : 'td';
        const cellClass = isHeader
          ? 'border border-gray-300 bg-blue-50 px-4 py-3 text-left font-semibold text-blue-900'
          : 'border border-gray-300 px-4 py-2 text-gray-700';

        const cellsHtml = cells.map(cell => `<${cellTag} class="${cellClass}">${cell}</${cellTag}>`).join('');
        tableHtml += `<tr class="hover:bg-gray-50">${cellsHtml}</tr>`;
      });

      tableHtml += '</table></div>';
      return tableHtml;
    })

    // Enhanced list styling
    .replace(/^- (.*$)/gm, '<li class="mb-2 pl-2 flex items-start"><span class="text-blue-500 mr-2 mt-1">•</span><span>$1</span></li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="mb-2 pl-2 flex items-start"><span class="text-blue-600 font-semibold mr-2 min-w-6">$1.</span><span>$2</span></li>')

    // Wrap consecutive list items
    .replace(/((?:<li class="mb-2[^>]*>.*?<\/li>\s*)+)/gs, '<ul class="space-y-1 mb-6 bg-gray-50 rounded-lg p-4">$1</ul>')

    // Bold text with enhanced styling
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">$1</strong>')

    // Code blocks and inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')

    // Emphasis
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-600">$1</em>')

    // Line breaks and paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
    .replace(/\n/g, '<br/>')

    // Wrap content in paragraphs (avoid wrapping headers, lists, tables)
    .replace(/^(?!<[hl]|<ul|<div|<table)(.+)$/gm, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>')

    // Clean up empty paragraphs
    .replace(/<p class="mb-4 text-gray-700 leading-relaxed"><\/p>/g, '')

    // Fix paragraphs around headers
    .replace(/<p class="mb-4 text-gray-700 leading-relaxed">(<h[1-3])/g, '$1')
    .replace(/(<\/h[1-3]>)<\/p>/g, '$1')

    // Fix paragraphs around lists
    .replace(/<p class="mb-4 text-gray-700 leading-relaxed">(<ul)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')

    // Fix paragraphs around tables
    .replace(/<p class="mb-4 text-gray-700 leading-relaxed">(<div class="overflow-x-auto)/g, '$1')
    .replace(/(<\/table><\/div>)<\/p>/g, '$1');
};

const EnhancedMarkdownRenderer: React.FC<EnhancedMarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  const htmlContent = convertMarkdownToHtml(content);

  return (
    <div
      className={`enhanced-markdown prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        // Custom CSS for enhanced styling
        '--tw-prose-body': 'rgb(55 65 81)',
        '--tw-prose-headings': 'rgb(17 24 39)',
        '--tw-prose-lead': 'rgb(55 65 81)',
        '--tw-prose-links': 'rgb(59 130 246)',
        '--tw-prose-bold': 'rgb(17 24 39)',
        '--tw-prose-counters': 'rgb(107 114 128)',
        '--tw-prose-bullets': 'rgb(107 114 128)',
        '--tw-prose-hr': 'rgb(229 231 235)',
        '--tw-prose-quotes': 'rgb(17 24 39)',
        '--tw-prose-quote-borders': 'rgb(229 231 235)',
        '--tw-prose-captions': 'rgb(107 114 128)',
        '--tw-prose-code': 'rgb(17 24 39)',
        '--tw-prose-pre-code': 'rgb(229 231 235)',
        '--tw-prose-pre-bg': 'rgb(31 41 55)',
        '--tw-prose-th-borders': 'rgb(209 213 219)',
        '--tw-prose-td-borders': 'rgb(229 231 235)'
      } as React.CSSProperties}
    />
  );
};

export default EnhancedMarkdownRenderer;