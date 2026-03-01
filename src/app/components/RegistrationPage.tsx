import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { registerStudent, RegisterResponse } from '../api/apiClient';
import { GraduationCap, Upload, ArrowLeft } from 'lucide-react';

interface RegistrationPageProps {
  onRegistrationComplete: () => void;
  onBackToLogin: () => void;
}

export function RegistrationPage({ onRegistrationComplete, onBackToLogin }: RegistrationPageProps) {
  const [step, setStep] = useState<'form' | 'photo'>('form');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    department: '',
  });

  // Photo capture
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rollNumber || !formData.name || !formData.department) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }
    setStep('photo');
    setMessage(null);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Could not access camera' });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
      setPhoto(file);
      setPhotoPreview(canvasRef.current!.toDataURL('image/jpeg'));
      
      // Stop the video stream
      const stream = videoRef.current!.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Stop the video stream if running
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleSubmitRegistration = async () => {
    if (!photo) {
      setMessage({ type: 'error', text: 'Please capture or upload a photo' });
      return;
    }

    setLoading(true);
    const response = await registerStudent({
      rollNumber: formData.rollNumber,
      name: formData.name,
      department: formData.department,
      imageFile: photo,
    });

    if (response.status === 'success') {
      setMessage({ type: 'success', text: 'Registration successful!' });
      setTimeout(() => {
        onRegistrationComplete();
      }, 1500);
    } else {
      setMessage({ type: 'error', text: response.message || 'Registration failed' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: '#1E3A8A' }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                Student Registration
              </h1>
              <p className="text-sm text-gray-600">Step {step === 'form' ? '1' : '2'} of 2</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onBackToLogin} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                name="rollNumber"
                type="text"
                placeholder="e.g., CS2021001"
                value={formData.rollNumber}
                onChange={handleFormChange}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleFormChange}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleFormChange}
                className="mt-1.5 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                style={{ borderColor: '#E5E7EB' }}
                required
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full text-white font-medium py-2.5 mt-6"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              Next: Capture Face
            </Button>
          </form>
        )}

        {/* Photo Capture Step */}
        {step === 'photo' && (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              {!photoPreview ? (
                <div className="space-y-4 p-6">
                  <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      onLoadedMetadata={startCamera}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex gap-2">
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 text-white font-medium py-2.5"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      📷 Capture Photo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2"
                      style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                    <img src={photoPreview} alt="Captured" className="w-full h-full object-cover" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        startCamera();
                      }}
                      className="text-center"
                      style={{ borderColor: '#EF4444', color: '#EF4444' }}
                    >
                      Retake
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-center"
                      style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
                      variant="outline"
                    >
                      Choose Different
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('form')}
                variant="outline"
                className="flex-1"
                style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitRegistration}
                disabled={loading || !photo}
                className="flex-1 text-white font-medium py-2.5"
                style={{ backgroundColor: '#1E3A8A' }}
              >
                {loading ? '⏳ Registering...' : '✓ Complete Registration'}
              </Button>
            </div>

            {/* User Info Preview */}
            <Card className="p-4 bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2 font-medium">Registration Details:</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium text-gray-700">Roll Number:</span> {formData.rollNumber}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Name:</span> {formData.name}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Department:</span> {formData.department}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
