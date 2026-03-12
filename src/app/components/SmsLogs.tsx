import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Phone, CheckCircle, RefreshCw } from 'lucide-react';
import { getSmsLogs, SmsLog } from '../api/apiClient';
import { Card } from './ui/card';
import { Button } from './ui/button';

export function SmsLogs() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const result = await getSmsLogs();
    if (result.status === 'success') setLogs(result.logs || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>SMS Notifications</h2>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
            History of alerts sent to absent students' parents
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-4"
          style={{ borderColor: '#C7D2FE', color: '#1E3A8A', backgroundColor: '#EEF2FF' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Bar */}
      <Card
        className="rounded-2xl"
        style={{
          border: '1px solid #C7D2FE',
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
        }}
      >
        <div className="px-6 py-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1E3A8A' }}
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>
              {logs.length} SMS {logs.length === 1 ? 'notification' : 'notifications'} sent
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Auto-generated absence alerts via Twilio
            </p>
          </div>
        </div>
      </Card>

      {/* Logs */}
      <div className="space-y-3">
        {logs.length === 0 && !loading ? (
          <Card
            className="rounded-2xl"
            style={{ border: '1px dashed #C7D2FE', backgroundColor: '#FAFBFF' }}
          >
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: '#EEF2FF' }}
              >
                <MessageSquare className="w-7 h-7" style={{ color: '#A5B4FC' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#64748B' }}>No SMS records found</p>
              <p className="text-xs mt-1 max-w-xs" style={{ color: '#94A3B8' }}>
                When you send absence alerts from the Reports page, they will appear here.
              </p>
            </div>
          </Card>
        ) : (
          logs.map((log, index) => (
            <Card
              key={index}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #1E3A8A',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(30,58,138,0.1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)')}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#EEF2FF' }}
                    >
                      <MessageSquare className="w-5 h-5" style={{ color: '#1E3A8A' }} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: '#0F172A' }}>
                          {log.student}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: '#EEF2FF', color: '#1E3A8A' }}
                        >
                          #{log.rollNo}
                        </span>
                      </div>
                      <p className="text-xs italic leading-relaxed" style={{ color: '#64748B' }}>
                        "{log.message}"
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium px-4 py-3 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: '#F8FAFF', border: '1px solid #EEF2FF' }}
                  >
                    <div className="flex items-center gap-1.5" style={{ color: '#64748B' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      {log.timestamp}
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: '#64748B' }}>
                      <Phone className="w-3.5 h-3.5" />
                      {log.phone}
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: '#059669' }}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {log.status}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
