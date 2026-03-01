import React, { useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// establish a single socket connection for the module
const socket: Socket = io('http://localhost:8000');

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

    const captureInterval = setInterval(() => {
      if (videoRef.current && socket.connected && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const data = canvasRef.current.toDataURL('image/jpeg', 0.5);
        socket.emit('stream_frame', data);
      }
    }, 200);

    const handler = (data: DetectionResult) => {
      if (onDetection) {
        onDetection(data);
      }
    };
    socket.on('detection_result', handler);

    return () => {
      clearInterval(captureInterval);
      socket.off('detection_result', handler);

      // stop the camera tracks when component unmounts
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onDetection]);

  return (
    <div className="w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={640}
        height={480}
        className="object-cover w-full h-full"
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AttendanceCamera;
