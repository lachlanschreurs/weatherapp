import { useState } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CSVUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ColumnMapping {
  timestamp?: string;
  location?: string;
  probe_depth?: string;
  moisture?: string;
  soil_temp?: string;
  rainfall?: string;
  battery?: string;
}

export function CSVUploadModal({ onClose, onSuccess }: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [csvPreview, setCSVPreview] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [connectionName, setConnectionName] = useState('');

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }

  async function handleFileSelect(selectedFile: File) {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setError('CSV file must have at least 2 rows (header + data)');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const preview = lines.slice(1, 4).map(line =>
        line.split(',').map(cell => cell.trim())
      );

      setCSVHeaders(headers);
      setCSVPreview(preview);

      const autoMapping: ColumnMapping = {};
      headers.forEach((header, index) => {
        const lower = header.toLowerCase();
        if (lower.includes('time') || lower.includes('date')) {
          autoMapping.timestamp = header;
        } else if (lower.includes('location') || lower.includes('site') || lower.includes('field')) {
          autoMapping.location = header;
        } else if (lower.includes('depth') || lower.includes('probe')) {
          autoMapping.probe_depth = header;
        } else if (lower.includes('moisture') || lower.includes('vwc') || lower.includes('water')) {
          autoMapping.moisture = header;
        } else if (lower.includes('temp') && lower.includes('soil')) {
          autoMapping.soil_temp = header;
        } else if (lower.includes('rain') || lower.includes('precip')) {
          autoMapping.rainfall = header;
        } else if (lower.includes('battery') || lower.includes('bat')) {
          autoMapping.battery = header;
        }
      });

      setColumnMapping(autoMapping);
      setStep('mapping');
    };

    reader.readAsText(selectedFile);
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;

        const { data: connection, error: connError } = await supabase
          .from('probe_connections')
          .insert({
            user_id: user.id,
            provider: 'csv_import',
            friendly_name: connectionName || file.name.replace('.csv', ''),
            connection_method: 'csv_import',
            auth_config: {},
            station_id: 'csv_' + Date.now(),
            is_active: true,
            sensor_mapping: columnMapping,
          })
          .select()
          .single();

        if (connError) throw connError;

        const { data: csvImport, error: importError } = await supabase
          .from('probe_csv_imports')
          .insert({
            user_id: user.id,
            connection_id: connection.id,
            filename: file.name,
            file_size: file.size,
            column_mapping: columnMapping,
            raw_data: csvText,
            status: 'pending',
          })
          .select()
          .single();

        if (importError) throw importError;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          await fetch(
            `${supabaseUrl}/functions/v1/process-csv-import?import_id=${csvImport.id}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      };

      reader.readAsText(file);

    } catch (err: any) {
      console.error('Error uploading CSV:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import CSV Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'upload' ? 'Upload your moisture probe CSV file' : 'Map CSV columns to data fields'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">CSV uploaded successfully!</p>
                <p className="text-sm text-green-600">Processing your data...</p>
              </div>
            </div>
          )}

          {step === 'upload' && !file && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-gray-600 mb-4">or click to browse</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
              >
                <FileText className="w-5 h-5" />
                Select CSV File
              </label>
              <div className="mt-6 text-sm text-gray-500">
                <p className="font-medium mb-2">Expected columns:</p>
                <ul className="text-left inline-block">
                  <li>• Timestamp / Date</li>
                  <li>• Location (optional)</li>
                  <li>• Probe/Depth (optional)</li>
                  <li>• Soil Moisture %</li>
                  <li>• Soil Temperature (optional)</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'mapping' && file && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection Name (optional)
                </label>
                <input
                  type="text"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder={file.name.replace('.csv', '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Map CSV Columns</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We've auto-detected some columns. Review and adjust as needed.
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Timestamp Column *
                    </label>
                    <select
                      value={columnMapping.timestamp || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, timestamp: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select column...</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Soil Moisture Column *
                    </label>
                    <select
                      value={columnMapping.moisture || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, moisture: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select column...</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Soil Temperature Column (optional)
                    </label>
                    <select
                      value={columnMapping.soil_temp || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, soil_temp: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">None</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Location Column (optional)
                    </label>
                    <select
                      value={columnMapping.location || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, location: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">None</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Probe/Depth Column (optional)
                    </label>
                    <select
                      value={columnMapping.probe_depth || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, probe_depth: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">None</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Preview</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {csvHeaders.map((header, idx) => (
                          <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {csvPreview.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-2 text-sm text-gray-900">
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          {step === 'mapping' && (
            <>
              <button
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setCSVHeaders([]);
                  setCSVPreview([]);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={uploading}
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !columnMapping.timestamp || !columnMapping.moisture}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Data
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
