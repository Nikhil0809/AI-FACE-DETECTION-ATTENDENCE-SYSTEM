import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// establish a single WebSocket connection for the module
const socket: WebSocket = new WebSocket("ws://localhost:8000/ws");

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

  useEffect(() => {
    // try to start the webcam when the component mounts
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Unable to access camera:', err);
        }
      }
    };

    startCamera();

    // Set up WebSocket message handler
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'detection_result' && onDetection) {
          onDetection(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    const captureInterval = setInterval(() => {
      if (videoRef.current && socket.readyState === WebSocket.OPEN && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const data = canvasRef.current.toDataURL('image/jpeg', 0.5);
        socket.send(JSON.stringify({
          type: 'stream_frame',
          data: data
        }));
      }
    }, 200);

    return () => {
      clearInterval(captureInterval);
      socket.removeEventListener('message', handleMessage);

      // stop the camera tracks when component unmounts
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onDetection]);

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
          animate={{
            top: ['10%', '90%', '10%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
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
