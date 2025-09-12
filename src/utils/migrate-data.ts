import { supabase } from '../services/supabaseClient';

interface CSVRow {
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

function parseCSVLine(line: string): string[] {
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

function parseDate(dateStr: string): string {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseVehicleNumber(vehicleStr: string): number {
  const match = vehicleStr.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function truncateString(value: string, maxLength: number): string | null {
  if (!value || value.trim() === '') return null;
  return value.length > maxLength ? value.substring(0, maxLength) : value;
}

function transformCSVRow(csvRow: string[], headers: string[]): any {
  const rowData: any = {};
  headers.forEach((header, index) => {
    rowData[header] = csvRow[index] || '';
  });

  return {
    service_report: truncateString(rowData['Service Report'], 50),
    entity_id: truncateString(rowData['New E ID'], 20),
    service_provider: truncateString(rowData['Service Provider'], 100),
    collected_date: parseDate(rowData['Collected Date']),
    discharged_date: parseDate(rowData['Discharged Date']),
    initiated_date: parseDate(rowData['Initiated Date']),
    area: truncateString(rowData['Area'], 50),
    assigned_vehicle: parseVehicleNumber(rowData['Assigned Vehicle']),
    category: truncateString(rowData['Category'], 50),
    discharge_txn: truncateString(rowData['Discharge TXN'], 50),
    outlet_name: truncateString(rowData['Entity Mapping.Outlet'], 200),
    gallons_collected: parseInt(rowData['Sum of Gallons Collected']) || 0,
    initiator: truncateString(rowData['Initiator'], 50),
    trap_count: parseInt(rowData['Sum of No of Traps']) || 1,
    status: truncateString(rowData['Status'], 20),
    sub_area: truncateString(rowData['Sub Area'], 50),
    sub_category: truncateString(rowData['Sub Category'], 50),
    trade_license_number: rowData['Trade License Number'] ? parseInt(rowData['Trade License Number']) : null,
    trap_label: truncateString(rowData['Trap Label'], 50),
    trap_type: truncateString(rowData['Trap Type'], 10),
    zone: truncateString(rowData['Zone'], 50)
  };
}

export async function migrateCSVData(csvContent: string, onProgress?: (progress: number) => void): Promise<void> {
  try {
    console.log('Parsing CSV data...');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    
    console.log('Headers found:', headers);
    console.log(`Total rows to process: ${lines.length - 1}`);
    
    const batchSize = 100; // Smaller batches for browser environment
    let totalImported = 0;
    
    // Process data in batches
    for (let i = 1; i < lines.length; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, lines.length);
      const batch = [];
      
      console.log(`Processing batch ${Math.ceil(i / batchSize)} (rows ${i} to ${batchEnd - 1})`);
      
      for (let j = i; j < batchEnd; j++) {
        const line = lines[j].trim();
        if (!line) continue;
        
        try {
          const values = parseCSVLine(line);
          if (values.length === headers.length) {
            const transformedRow = transformCSVRow(values, headers);
            batch.push(transformedRow);
          }
        } catch (error) {
          console.warn(`Error processing row ${j + 1}:`, error);
        }
      }
      
      if (batch.length > 0) {
        console.log(`Inserting ${batch.length} records into database...`);
        
        // Try to insert with upsert to handle duplicates
        const { error } = await supabase
          .from('services')
          .upsert(batch, { 
            onConflict: 'service_report',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
        
        totalImported += batch.length;
        console.log(`Successfully imported ${totalImported} records so far`);
        
        if (onProgress) {
          onProgress(Math.round((totalImported / (lines.length - 1)) * 100));
        }
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`Total records imported: ${totalImported}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Function to read file from input and trigger migration
export async function migrateFromFile(file: File, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const csvContent = event.target?.result as string;
        await migrateCSVData(csvContent, onProgress);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}