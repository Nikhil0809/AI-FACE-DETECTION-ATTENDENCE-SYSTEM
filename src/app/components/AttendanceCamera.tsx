import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, CameraOff, RefreshCw, UserCheck, AlertCircle, ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DetectionResult {
  id?: string;
  rollNo?: string;
  name: string;
  confidence?: number;
  timestamp?: string;
  status?: 'matched' | 'unknown' | 'no_face' | 'error';
  note?: string;
  roll_number?: string;
}

interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

interface AttendanceCameraProps {
  onDetection?: (result: DetectionResult) => void;
  captureIntervalMs?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_URL = 'ws://localhost:8000/ws';
const MAX_RECONNECT_DELAY_MS = 15_000;
const DEVICE_KEY = 'preferred_camera_device';

// ─── Component ────────────────────────────────────────────────────────────────

const AttendanceCamera: React.FC<AttendanceCameraProps> = ({
  onDetection,
  captureIntervalMs = 300,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(500);
  const unmountedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [detectionMsg, setDetectionMsg] = useState<string | null>(null);
  const [detectionKind, setDetectionKind] = useState<'success' | 'info'>('info');
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    () => localStorage.getItem(DEVICE_KEY) ?? ''
  );
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const onDetectionRef = useRef(onDetection);
  useEffect(() => { onDetectionRef.current = onDetection; }, [onDetection]);

  // ── Enumerate cameras ──────────────────────────────────────────────────────
  const loadDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === 'videoinput');
      setDevices(cams);
      // If no preference saved yet, auto-pick the first PHYSICAL webcam
      // (label usually contains "webcam", "integrated", or "HD" on laptops)
      if (!localStorage.getItem(DEVICE_KEY) && cams.length > 0) {
        const preferred =
          cams.find(d =>
            /webcam|integrated|built.?in|internal|hd|front/i.test(d.label)
          ) ?? cams[0];
        setSelectedDeviceId(preferred.deviceId);
        localStorage.setItem(DEVICE_KEY, preferred.deviceId);
      }
    } catch {/* permissions not granted yet */ }
  }, []);

  // ── Draw face bounding box ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!faceBox) return;

    const scaleX = canvas.width / (video.videoWidth || 640);
    const scaleY = canvas.height / (video.videoHeight || 480);
    const bx = faceBox.x * scaleX;
    const by = faceBox.y * scaleY;
    const bw = faceBox.w * scaleX;
    const bh = faceBox.h * scaleY;

    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(79,142,247,0.7)';
    ctx.strokeStyle = '#4F8EF7';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#A5C8FF';
    ctx.lineWidth = 4;
    const cLen = Math.min(bw, bh) * 0.22;
    const corners = [
      [bx, by, cLen, 0, 0, cLen],
      [bx + bw, by, -cLen, 0, 0, cLen],
      [bx, by + bh, cLen, 0, 0, -cLen],
      [bx + bw, by + bh, -cLen, 0, 0, -cLen],
    ] as const;
    corners.forEach(([x, y, dx1, , , dy2]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx1, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy2);
      ctx.stroke();
    });
  }, [faceBox]);

  // ── Face box auto-clear ────────────────────────────────────────────────────
  const faceBoxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshFaceBox = useCallback((box?: FaceBox) => {
    if (faceBoxTimerRef.current) clearTimeout(faceBoxTimerRef.current);
    if (box) {
      setFaceBox(box);
      faceBoxTimerRef.current = setTimeout(() => setFaceBox(null), 1500);
    } else {
      setFaceBox(null);
    }
  }, []);

  // ── Detection toast ────────────────────────────────────────────────────────
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string, kind: 'success' | 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setDetectionMsg(msg);
    setDetectionKind(kind);
    toastTimerRef.current = setTimeout(() => setDetectionMsg(null), 3000);
  }, []);

  // ── WebSocket with auto-reconnect ─────────────────────────────────────────
  const openWebSocket = useCallback(() => {
    if (unmountedRef.current) return;
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => { reconnectDelayRef.current = 500; };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as DetectionResult & {
          type?: string; bbox?: FaceBox;
        };
        if (data.type === 'detection_result' || data.status) {
          if (data.bbox) refreshFaceBox(data.bbox);
          if (data.status === 'matched') {
            const already = data.note === 'Already marked present today';
            showToast(
              already ? `✓ ${data.name} — already marked` : `✓ ${data.name} (${data.roll_number})`,
              already ? 'info' : 'success'
            );
          } else if (data.status === 'no_face') {
            refreshFaceBox(undefined);
          }
          if (onDetectionRef.current && (data.status === 'matched' || data.status === 'unknown')) {
            onDetectionRef.current(data as DetectionResult);
          }
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
      reconnectTimerRef.current = setTimeout(openWebSocket, delay);
    };

    ws.onerror = () => ws.close();
  }, [refreshFaceBox, showToast]);

  // ── Start/restart camera stream for a given deviceId ──────────────────────
  const startStream = useCallback(async (deviceId: string) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      streamRef.current = null;
    }

    setCameraState('requesting');

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: deviceId
        ? { deviceId: { exact: deviceId }, width: 640, height: 480 }
        : { width: 640, height: 480, facingMode: 'user' },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (unmountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraState('active');

      // Now we have permissions — load the full device list
      await loadDevices();
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        // If exact deviceId fails (e.g. device disconnected), fall back
        if (deviceId) {
          console.warn('Selected camera failed, falling back to default');
          localStorage.removeItem(DEVICE_KEY);
          setSelectedDeviceId('');
          return startStream('');
        }
        setCameraState('error');
      }
    }
  }, [loadDevices]);

  // ── Capture loop (depends on active stream) ────────────────────────────────
  useEffect(() => {
    if (cameraState !== 'active') return;

    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = 640;
    hiddenCanvas.height = 480;
    const ctx = hiddenCanvas.getContext('2d')!;

    const waitForPlay = () => new Promise<void>(resolve => {
      const v = videoRef.current!;
      if (v.readyState >= 2) { resolve(); return; }
      v.addEventListener('canplay', () => resolve(), { once: true });
    });

    let captureId: ReturnType<typeof setInterval> | null = null;

    waitForPlay().then(() => {
      if (unmountedRef.current) return;
      captureId = setInterval(() => {
        const ws = socketRef.current;
        const v = videoRef.current;
        if (!v || !ws || ws.readyState !== WebSocket.OPEN) return;
        if (v.readyState < 2 || v.paused || v.ended) return;
        ctx.drawImage(v, 0, 0, 640, 480);
        ws.send(JSON.stringify({ type: 'stream_frame', data: hiddenCanvas.toDataURL('image/jpeg', 0.6) }));
      }, captureIntervalMs);
    });

    return () => { if (captureId) clearInterval(captureId); };
  }, [cameraState, captureIntervalMs]);

  // ── Mount / unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    unmountedRef.current = false;
    openWebSocket();
    startStream(selectedDeviceId);

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (faceBoxTimerRef.current) clearTimeout(faceBoxTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      const ws = socketRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Switch camera ──────────────────────────────────────────────────────────
  const handleDeviceChange = (deviceId: string) => {
    localStorage.setItem(DEVICE_KEY, deviceId);
    setSelectedDeviceId(deviceId);
    setShowDevicePicker(false);
    startStream(deviceId);
  };

  const handleRetry = () => startStream(selectedDeviceId);

  // ─── Error states ──────────────────────────────────────────────────────────

  if (cameraState === 'denied') {
    return (
      <div className="relative w-full min-h-[400px] rounded-xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <CameraOff className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Camera Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Allow camera access in your browser settings, then click Retry.
          </p>
        </div>
        <button onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (cameraState === 'error') {
    return (
      <div className="relative w-full min-h-[400px] rounded-xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-yellow-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Camera Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Could not access the selected camera. Try switching to a different one.
          </p>
        </div>
        <button onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // ─── Normal camera view ────────────────────────────────────────────────────

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);
  const deviceLabel = (d: MediaDeviceInfo, i: number) =>
    d.label || `Camera ${i + 1}`;

  return (
    <div className="space-y-2">
      {/* ── Camera device picker ── */}
      {devices.length > 1 && (
        <div className="relative flex justify-end">
          <button
            onClick={() => setShowDevicePicker((p: boolean) => !p)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border/50 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <ScanFace className="w-3.5 h-3.5 opacity-60" />
            <span className="max-w-[180px] truncate">
              {selectedDevice ? deviceLabel(selectedDevice as MediaDeviceInfo, devices.indexOf(selectedDevice)) : 'Select Camera'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${showDevicePicker ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showDevicePicker && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 right-0 z-50 w-64 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden"
              >
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2.5 pb-1">
                  Available Cameras
                </p>
                {devices.map((d: MediaDeviceInfo, i: number) => (
                  <button
                    key={d.deviceId}
                    onClick={() => handleDeviceChange(d.deviceId)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary/60 transition-colors flex items-center gap-2 ${d.deviceId === selectedDeviceId ? 'text-primary font-semibold' : 'text-foreground'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.deviceId === selectedDeviceId ? 'bg-primary' : 'bg-muted'}`} />
                    <span className="truncate">{deviceLabel(d, i)}</span>
                    {d.deviceId === selectedDeviceId && (
                      <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Active</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Camera feed ── */}
      <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-xl bg-black/90">

        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm font-medium text-white/70">Starting camera…</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        <canvas
          ref={overlayRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-6 left-6 w-14 h-14 border-t-[3px] border-l-[3px] border-primary rounded-tl-xl opacity-80 shadow-[0_0_12px_rgba(79,142,247,0.6)]" />
          <div className="absolute top-6 right-6 w-14 h-14 border-t-[3px] border-r-[3px] border-primary rounded-tr-xl opacity-80 shadow-[0_0_12px_rgba(79,142,247,0.6)]" />
          <div className="absolute bottom-6 left-6 w-14 h-14 border-b-[3px] border-l-[3px] border-primary rounded-bl-xl opacity-80 shadow-[0_0_12px_rgba(79,142,247,0.6)]" />
          <div className="absolute bottom-6 right-6 w-14 h-14 border-b-[3px] border-r-[3px] border-primary rounded-br-xl opacity-80 shadow-[0_0_12px_rgba(79,142,247,0.6)]" />

          <motion.div
            className="absolute left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_10px_rgba(79,142,247,0.9)] z-20"
            animate={{ top: ['8%', '92%', '8%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

          {cameraState === 'active' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">Live</span>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-black/60 backdrop-blur-md text-white/80 px-4 py-1.5 rounded-full text-xs font-semibold border border-white/10 uppercase tracking-widest">
              <ScanFace className="inline w-3 h-3 mr-1.5 -mt-0.5" />
              AI Face Detection Active
            </span>
          </div>
        </div>

        <AnimatePresence>
          {detectionMsg && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`absolute bottom-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-xl text-sm font-semibold backdrop-blur-md whitespace-nowrap ${detectionKind === 'success'
                ? 'bg-green-500/90 border-green-400/40 text-white shadow-green-500/30'
                : 'bg-blue-500/80 border-blue-400/30 text-white shadow-blue-500/20'
                }`}
            >
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              {detectionMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceCamera;
