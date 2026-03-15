import { useState, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Trash2,
  Download,
} from 'lucide-react';
import { getDepartments } from '../api/apiClient';

const API_BASE_URL = 'http://localhost:8000';

interface CsvRow {
  roll_number: string;
  name: string;
  department_id: string;
  section_id?: string;
  phone_number?: string;
  [key: string]: string | undefined;
}

interface ImportResult {
  success_count: number;
  error_count: number;
  errors: { row: CsvRow; error: string }[];
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
  return { headers, rows };
}

// Auto-detect column mapping from CSV headers
function autoMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {
    roll_number: '', name: '', department_id: '', section_id: '', phone_number: '',
  };
  const matchers: Record<string, RegExp> = {
    roll_number: /roll|register|regno/i,
    name: /^name$/i,
    department_id: /dept|department/i,
    section_id: /section|sec/i,
    phone_number: /phone|mobile|contact/i,
  };
  headers.forEach((h) => {
    for (const [field, re] of Object.entries(matchers)) {
      if (re.test(h) && !map[field]) map[field] = h;
    }
  });
  return map;
}

export function CsvUpload() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const REQUIRED_FIELDS = ['roll_number', 'name', 'department_id'];
  const OPTIONAL_FIELDS = ['section_id', 'phone_number'];
  const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    setFileName(file.name);
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);
      setHeaders(h);
      setRows(r);
      setColumnMap(autoMap(h));
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleImport = async () => {
    const missingRequired = REQUIRED_FIELDS.filter((f) => !columnMap[f]);
    if (missingRequired.length > 0) {
      setError(`Please map required fields: ${missingRequired.join(', ')}`);
      return;
    }
    setImporting(true);
    setError('');

    try {
      const payload: CsvRow[] = rows.map((row) => {
        const mapped: CsvRow = {
          roll_number: row[columnMap.roll_number] || '',
          name: row[columnMap.name] || '',
          department_id: row[columnMap.department_id] || '',
        };
        if (columnMap.section_id) mapped.section_id = row[columnMap.section_id];
        if (columnMap.phone_number) mapped.phone_number = row[columnMap.phone_number];
        return mapped;
      });

      const res = await fetch(`${API_BASE_URL}/students/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResult({ success_count: data.success_count, error_count: data.error_count, errors: data.errors || [] });
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (e) {
      setError('Failed to connect to server. Is the backend running?');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setHeaders([]);
    setRows([]);
    setFileName('');
    setColumnMap({});
    setResult(null);
    setError('');
  };

  const downloadTemplate = () => {
    const csv = 'roll_number,name,department_id,section_id,phone_number\n24CS001,John Doe,1,1,9876543210\n24CS002,Jane Smith,1,2,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#0F172A' }}>CSV Bulk Upload</h2>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Import multiple students at once from a spreadsheet</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-sm font-semibold rounded-xl"
          style={{ borderColor: '#C7D2FE', color: '#1E3A8A', backgroundColor: '#EEF2FF' }}
        >
          <Download className="w-4 h-4" />
          Download Template
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result Banner */}
      {result && (
        <div className={`p-5 rounded-2xl border ${result.error_count === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            {result.error_count === 0
              ? <CheckCircle className="w-6 h-6 text-green-600" />
              : <AlertCircle className="w-6 h-6 text-amber-600" />
            }
            <p className="font-bold" style={{ color: result.error_count === 0 ? '#059669' : '#D97706' }}>
              Import Complete
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-1.5" style={{ color: '#059669' }}>
              <CheckCircle className="w-4 h-4" /> {result.success_count} imported successfully
            </span>
            {result.error_count > 0 && (
              <span className="flex items-center gap-1.5" style={{ color: '#DC2626' }}>
                <XCircle className="w-4 h-4" /> {result.error_count} failed
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs" style={{ color: '#DC2626' }}>
                  Row {i + 1} ({e.row?.roll_number}): {e.error}
                </p>
              ))}
            </div>
          )}
          <Button onClick={handleReset} variant="outline" size="sm" className="mt-3 rounded-xl">
            Upload Another File
          </Button>
        </div>
      )}

      {!result && (
        <>
          {/* Drop Zone */}
          <Card
            className="rounded-2xl overflow-hidden"
            style={{ border: `2px dashed ${dragging ? '#1E3A8A' : '#C7D2FE'}`, backgroundColor: dragging ? '#EEF2FF' : '#FAFBFF', transition: 'all 0.2s' }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="p-12 flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: dragging ? '#C7D2FE' : '#EEF2FF' }}
              >
                <Upload className="w-8 h-8" style={{ color: '#1E3A8A' }} />
              </div>
              {fileName ? (
                <>
                  <p className="font-bold text-sm" style={{ color: '#0F172A' }}>{fileName}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>{rows.length} rows detected</p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>Drop your CSV file here</p>
                  <p className="text-xs mt-1 mb-4" style={{ color: '#94A3B8' }}>or click to browse</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-semibold text-white rounded-xl px-6"
                    style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' }}
                  >
                    Browse File
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </Card>

          {/* Column Mapping */}
          {headers.length > 0 && (
            <Card className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Column Mapping</p>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Map your CSV columns to the required fields</p>
              </div>
              <div className="p-6 space-y-4" style={{ backgroundColor: '#FAFBFF' }}>
                <div className="grid grid-cols-2 gap-4">
                  {ALL_FIELDS.map((field) => (
                    <div key={field} className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-semibold flex items-center gap-1" style={{ color: '#64748B' }}>
                          {field.replace(/_/g, ' ')}
                          {REQUIRED_FIELDS.includes(field) && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </label>
                      </div>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: '#CBD5E1' }} />
                      <select
                        value={columnMap[field] || ''}
                        onChange={(e) => setColumnMap({ ...columnMap, [field]: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs rounded-xl outline-none"
                        style={{ border: '1px solid #C7D2FE', backgroundColor: '#FFFFFF', color: '#0F172A' }}
                      >
                        <option value="">-- not mapped --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Preview Table */}
          {rows.length > 0 && (
            <Card className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0F172A' }}>
                    <FileText className="inline w-4 h-4 mr-1.5" style={{ color: '#1E3A8A' }} />
                    Preview
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>First 5 rows of {rows.length} total</p>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 text-sm font-semibold text-white rounded-xl px-5 py-2"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                >
                  {importing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import {rows.length} Students
                    </>
                  )}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '1px solid #E2E8F0' }}>
                      {headers.map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-semibold" style={{ color: '#64748B' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFF' }}>
                        {headers.map((h) => (
                          <td key={h} className="px-4 py-2" style={{ color: '#374151' }}>{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Instructions */}
          {rows.length === 0 && (
            <Card className="p-5 rounded-2xl" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#0369A1' }}>📋 CSV Format Guide</h4>
              <ul className="text-xs space-y-1.5" style={{ color: '#0369A1' }}>
                <li>✓ <strong>Required columns:</strong> roll_number, name, department_id</li>
                <li>✓ <strong>Optional columns:</strong> section_id, phone_number</li>
                <li>✓ Students imported without face photos — they'll need face registration separately for recognition</li>
                <li>✓ department_id must be a number (1–18 as per system departments)</li>
                <li>✓ Download the template above for a ready-to-fill example</li>
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
