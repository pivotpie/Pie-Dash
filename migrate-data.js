import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Environment variables
const supabaseUrl = 'https://gelidvvlytripwcmwpjh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGlkdnZseXRyaXB3Y213cGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzcwMzUsImV4cCI6MjA3MDk1MzAzNX0.va7aLm-_Kt5Jl1G8p9EfJ3SwZNca3tO9LD2ixL1BgAA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// CSV Parser functions
function parseCSVLine(line) {
  const result = [];
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

function parseDate(dateStr) {
  // Handle MM/DD/YYYY format from CSV
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseVehicleNumber(vehicleStr) {
  // Extract numeric value from vehicle strings like "B 37216" or "51271"
  const match = vehicleStr.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function transformCSVRow(csvRow, headers) {
  const rowData = {};
  headers.forEach((header, index) => {
    rowData[header] = csvRow[index] || '';
  });

  // Helper function to truncate strings to fit database constraints
  function truncateString(value, maxLength) {
    return value && value.length > maxLength ? value.substring(0, maxLength) : value;
  }

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
    sub_area: truncateString(rowData['Sub Area'], 50) || null,
    sub_category: truncateString(rowData['Sub Category'], 50) || null,
    trade_license_number: rowData['Trade License Number'] ? parseInt(rowData['Trade License Number']) : null,
    trap_label: truncateString(rowData['Trap Label'], 50) || null,
    trap_type: truncateString(rowData['Trap Type'], 10) || null, // Truncate to 10 chars
    zone: truncateString(rowData['Zone'], 50)
  };
}

async function importData() {
  try {
    console.log('Reading CSV file...');
    const csvPath = 'Blue Data Analysis.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log('Parsing CSV data...');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    
    console.log('Headers found:', headers);
    console.log(`Total rows to process: ${lines.length - 1}`);
    
    const batchSize = 500;
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
          console.warn(`Error processing row ${j + 1}:`, error.message);
        }
      }
      
      if (batch.length > 0) {
        console.log(`Inserting ${batch.length} records into database...`);
        const { error } = await supabase
          .from('services')
          .insert(batch);
        
        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
        
        totalImported += batch.length;
        console.log(`Successfully imported ${totalImported} records so far`);
      }
    }
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`Total records imported: ${totalImported}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
importData();