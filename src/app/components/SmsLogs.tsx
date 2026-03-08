import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Calendar, Phone, User, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { getSmsLogs, SmsLog } from '../api/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

export function SmsLogs() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const result = await getSmsLogs();
    if (result.status === 'success') {
      setLogs(result.logs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SMS Notifications</h2>
          <p className="text-muted-foreground mt-1">History of alerts sent to absent students' parents</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {logs.length === 0 && !loading ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No SMS records found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                When you send absence alerts from the Reports page, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={index}
            >
              <Card className="hover:shadow-md transition-all border-l-4 border-l-primary">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{log.student}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">#{log.rollNo}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          "{log.message}"
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/40">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {log.timestamp}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        {log.phone}
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {log.status}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
