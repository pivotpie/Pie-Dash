// utils/exportUtils.ts
export class ExportUtils {
    static exportToCSV(data: any[], filename: string) {
      if (data.length === 0) return;
  
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');
  
      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }
  
    static exportToJSON(data: any[], filename: string) {
      const jsonContent = JSON.stringify(data, null, 2);
      this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }
  
    static async exportToPDF(data: any[], title: string, filename: string) {
      // For PDF export, you would integrate with a library like jsPDF
      // This is a simplified implementation
      const htmlContent = this.generateHTMLReport(data, title);
      
      // Print or use PDF generation library
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  
    private static generateHTMLReport(data: any[], title: string): string {
      if (data.length === 0) return '<p>No data to export</p>';
  
      const headers = Object.keys(data[0]);
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              h1 { color: #333; }
              .timestamp { font-size: 12px; color: #666; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
            <table>
              <thead>
                <tr>
                  ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
    }
  
    private static downloadFile(content: string, filename: string, mimeType: string) {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    }
  }