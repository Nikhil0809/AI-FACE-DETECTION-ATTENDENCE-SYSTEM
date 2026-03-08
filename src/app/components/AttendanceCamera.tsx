import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface DetectionResult {
  id?: string;
  rollNo?: string;
  name: string;
  confidence?: number;
  timestamp?: string;
  image?: string;
}

interface AttendanceCameraProps {
  /**
   * Callback that is invoked every time the backend
   * returns a `detection_result` event.  The object
   * shape is loosely typed because the server may send
   * additional fields.
   */
  onDetection?: (result: DetectionResult) => void;
}

const AttendanceCamera: React.FC<AttendanceCameraProps> = ({ onDetection }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep socket in a ref so cleanup can always reach the current instance
  const socketRef = useRef<WebSocket | null>(null);

  // Stable reference to the callback so the effect doesn't re-run on every render
  const onDetectionRef = useRef(onDetection);
  useEffect(() => {
    onDetectionRef.current = onDetection;
  }, [onDetection]);

  useEffect(() => {
    // ── 1. Start the webcam ──────────────────────────────────────────────────
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Unable to access camera:', err);
        }
      }
    };

    startCamera();

    // ── 2. Open WebSocket per-mount (avoids stale/shared socket) ────────────
    const ws = new WebSocket('ws://localhost:8000/ws');
    socketRef.current = ws;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'detection_result' && onDetectionRef.current) {
          onDetectionRef.current(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);

    // ── 3. Capture & send frames every 200 ms ───────────────────────────────
    const captureInterval = setInterval(() => {
      if (
        videoRef.current &&
        canvasRef.current &&
        ws.readyState === WebSocket.OPEN
      ) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const data = canvasRef.current.toDataURL('image/jpeg', 0.5);
        ws.send(JSON.stringify({ type: 'stream_frame', data }));
      }
    }, 200);

    // ── 4. Cleanup on unmount ────────────────────────────────────────────────
    return () => {
      clearInterval(captureInterval);
      ws.removeEventListener('message', handleMessage);
      // Close the WebSocket cleanly
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      socketRef.current = null;

      // Stop all camera tracks
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // empty deps – runs once on mount, cleans up on unmount

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-xl bg-black/5">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={640}
        height={480}
        className="object-cover w-full h-full opacity-90"
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ display: 'none' }}
      />

      {/* Scanning Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Frame Corners */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-xl opacity-80 shadow-[0_0_15px_rgba(79,142,247,0.5)]" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-xl opacity-80 shadow-[0_0_15px_rgba(79,142,247,0.5)]" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-xl opacity-80 shadow-[0_0_15px_rgba(79,142,247,0.5)]" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-xl opacity-80 shadow-[0_0_15px_rgba(79,142,247,0.5)]" />

        {/* Animated Scanning Line */}
        <motion.div
          className="absolute left-8 right-8 h-[2px] bg-primary shadow-[0_0_10px_rgba(79,142,247,0.8)] z-20"
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] mix-blend-overlay" />

        {/* Helper Text */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="bg-background/80 backdrop-blur-md text-foreground px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-border/50 uppercase tracking-widest">
            AI Face Detection Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCamera;
