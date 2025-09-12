import { supabase } from '../services/supabaseClient';

export interface CSVRow {
  'Service Report': string;
  'New E ID': string;
  'Service Provider': string;
  'Collected Date': string;
  'Discharged Date': string;
  'Initiated Date': string;
  'Area': string;
  'Assigned Vehicle': string;
  'Category': string;
  'Discharge TXN': string;
  'Entity Mapping.Outlet': string;
  'Sum of Gallons Collected': string;
  'Initiator': string;
  'Sum of No of Traps': string;
  'Status': string;
  'Sub Area': string;
  'Sub Category': string;
  'Trade License Number': string;
  'Trap Label': string;
  'Trap Type': string;
  'Zone': string;
}

export class CSVImporter {
  static parseCSV(file: File): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const lines = csvText.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const data: CSVRow[] = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCSVLine(line);
            if (values.length === headers.length) {
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              data.push(row as CSVRow);
            }
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  static transformCSVRow(csvRow: CSVRow): any {
    return {
      service_report: csvRow['Service Report'],
      entity_id: csvRow['New E ID'],
      service_provider: csvRow['Service Provider'],
      collected_date: this.parseDate(csvRow['Collected Date']),
      discharged_date: this.parseDate(csvRow['Discharged Date']),
      initiated_date: this.parseDate(csvRow['Initiated Date']),
      area: csvRow['Area'],
      assigned_vehicle: parseInt(csvRow['Assigned Vehicle']),
      category: csvRow['Category'],
      discharge_txn: csvRow['Discharge TXN'],
      outlet_name: csvRow['Entity Mapping.Outlet'],
      gallons_collected: parseInt(csvRow['Sum of Gallons Collected']),
      initiator: csvRow['Initiator'],
      trap_count: parseInt(csvRow['Sum of No of Traps']) || 1,
      status: csvRow['Status'],
      sub_area: csvRow['Sub Area'],
      sub_category: csvRow['Sub Category'],
      trade_license_number: csvRow['Trade License Number'] ? parseInt(csvRow['Trade License Number']) : null,
      trap_label: csvRow['Trap Label'],
      trap_type: csvRow['Trap Type'],
      zone: csvRow['Zone']
    };
  }

  static parseDate(dateStr: string): string {
    // Handle MM/DD/YYYY format from CSV
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  static async importToSupabase(csvData: CSVRow[], onProgress?: (progress: number) => void): Promise<void> {
    const batchSize = 500;
    const totalRows = csvData.length;
    let imported = 0;

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      const transformedBatch = batch.map(row => this.transformCSVRow(row));

      const { error } = await supabase
        .from('services')
        .insert(transformedBatch);

      if (error) {
        console.error('Import error:', error);
        throw error;
      }

      imported += batch.length;
      if (onProgress) {
        onProgress(Math.round((imported / totalRows) * 100));
      }
    }
  }
}