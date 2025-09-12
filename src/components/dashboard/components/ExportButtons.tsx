// components/dashboard/components/ExportButtons.tsx
import React from 'react';
import { Button } from '../../ui/button';
import { DownloadIcon } from 'lucide-react';
import { ExportUtils } from '../../../utils/exportUtils';

interface ExportButtonsProps {
  data: any[];
  filename: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ data, filename }) => {
  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    switch (format) {
      case 'csv':
        ExportUtils.exportToCSV(data, filename);
        break;
      case 'json':
        ExportUtils.exportToJSON(data, filename);
        break;
      case 'pdf':
        ExportUtils.exportToPDF(data, filename, filename);
        break;
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
      >
        <DownloadIcon className="mr-1 h-3 w-3" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('json')}
      >
        <DownloadIcon className="mr-1 h-3 w-3" />
        JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
      >
        <DownloadIcon className="mr-1 h-3 w-3" />
        PDF
      </Button>
    </div>
  );
};