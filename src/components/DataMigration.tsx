import { useState } from 'react';
import { migrateFromFile } from '../utils/migrate-data';

export default function DataMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setProgress(0);
    setMessage('Starting migration...');

    try {
      await migrateFromFile(file, (progressPercent) => {
        setProgress(progressPercent);
        setMessage(`Migration in progress: ${progressPercent}%`);
      });
      
      setMessage('✅ Migration completed successfully!');
    } catch (error) {
      console.error('Migration error:', error);
      setMessage(`❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlueDataMigration = async () => {
    setIsLoading(true);
    setProgress(0);
    setMessage('Loading Blue Data Analysis.csv...');

    try {
      // Fetch the CSV file from the public directory
      const response = await fetch('/Blue Data Analysis.csv');
      if (!response.ok) {
        throw new Error('Failed to load CSV file');
      }
      
      const csvContent = await response.text();
      const { migrateCSVData } = await import('../utils/migrate-data');
      
      await migrateCSVData(csvContent, (progressPercent) => {
        setProgress(progressPercent);
        setMessage(`Migration in progress: ${progressPercent}%`);
      });
      
      setMessage('✅ Blue Data Analysis migration completed successfully!');
    } catch (error) {
      console.error('Migration error:', error);
      setMessage(`❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Data Migration</h2>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={handleBlueDataMigration}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Migrating...' : 'Migrate Blue Data Analysis.csv'}
          </button>
        </div>

        <div className="text-center text-gray-500">or</div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{progress}% complete</p>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-700' 
            : message.includes('❌')
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}