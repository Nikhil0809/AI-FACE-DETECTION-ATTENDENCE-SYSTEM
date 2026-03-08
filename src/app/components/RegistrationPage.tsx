import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { registerStudent, getDepartments, getSections, Department, Section } from '../api/apiClient';
import { GraduationCap, Upload, ArrowLeft, Camera as CameraIcon, Video, VideoOff } from 'lucide-react';

const DEVICE_KEY = 'preferred_registration_camera';

interface RegistrationPageProps {
  onRegistrationComplete: () => void;
  onBackToLogin: () => void;
}

export function RegistrationPage({ onRegistrationComplete, onBackToLogin }: RegistrationPageProps) {
  const [step, setStep] = useState<'form' | 'photo'>('form');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Departments and sections
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    phoneNumber: '',
    departmentId: '',
    sectionId: '',
  });

  // Photo capture
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Camera selection state
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    () => localStorage.getItem(DEVICE_KEY) ?? ''
  );
  const [cameraActive, setCameraActive] = useState(false);

  // Attach stream to video element once it is rendered
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Load departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepts(true);
        const depts = await getDepartments();
        if (depts && depts.length > 0) {
          setDepartments(depts);
        } else {
          setMessage({ type: 'error', text: 'Failed to load departments' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load departments' });
      } finally {
        setLoadingDepts(false);
      }
    };
    loadDepartments();
  }, []);

  // Load sections when department changes
  useEffect(() => {
    if (formData.departmentId) {
      const loadSections = async () => {
        const secs = await getSections(parseInt(formData.departmentId));
        setSections(secs);
      };
      loadSections();
    } else {
      setSections([]);
    }
  }, [formData.departmentId]);

  // ── Camera helpers ────────────────────────────────────────────────────────

  const loadDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === 'videoinput');
      setDevices(cams);
      if (!localStorage.getItem(DEVICE_KEY) && cams.length > 0) {
        const preferred =
          cams.find(d => /webcam|integrated|built.?in|internal|hd|front/i.test(d.label)) ?? cams[0];
        setSelectedDeviceId(preferred.deviceId);
        localStorage.setItem(DEVICE_KEY, preferred.deviceId);
      }
    } catch { /* ignore */ }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: 640, height: 480 }
          : { width: 640, height: 480, facingMode: 'user' },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      // setCameraActive triggers a re-render → the useEffect attaches the stream
      setCameraActive(true);
      await loadDevices();
    } catch {
      setMessage({ type: 'error', text: 'Could not access camera. Please allow camera permissions.' });
    }
  };

  // Restart when selected device changes (if already active)
  useEffect(() => {
    if (cameraActive && selectedDeviceId) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  // Clean up when leaving photo step
  useEffect(() => {
    if (step !== 'photo') stopCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Form handlers ─────────────────────────────────────────────────────────

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rollNumber || !formData.name || !formData.phoneNumber || !formData.departmentId || !formData.sectionId) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }
    const phoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/[-\s]/g, ''))) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number (10 digits starting with 6-9)' });
      return;
    }
    setStep('photo');
    setMessage(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
      setPhoto(file);
      setPhotoPreview(dataUrl);
      stopCamera();
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      stopCamera();
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
      phoneNumber: formData.phoneNumber,
      departmentId: parseInt(formData.departmentId),
      sectionId: parseInt(formData.sectionId),
      imageFile: photo,
    });
    if (response.status === 'success') {
      setMessage({ type: 'success', text: 'Registration successful!' });
      setTimeout(() => onRegistrationComplete(), 1500);
    } else {
      setMessage({ type: 'error', text: response.message || 'Registration failed' });
    }
    setLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
              <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>Student Registration</h1>
              <p className="text-sm text-gray-600">Step {step === 'form' ? '1' : '2'} of 2</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onBackToLogin} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Alert messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* ── STEP 1: Form ── */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input id="rollNumber" name="rollNumber" type="text" placeholder="e.g., CS2021001"
                value={formData.rollNumber} onChange={handleFormChange} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" type="text" placeholder="Enter your full name"
                value={formData.name} onChange={handleFormChange} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="e.g., +91-9876543210"
                value={formData.phoneNumber} onChange={handleFormChange} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <select id="department" name="departmentId" value={formData.departmentId}
                onChange={handleFormChange}
                className="mt-1.5 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                required disabled={loadingDepts}>
                <option value="">{loadingDepts ? 'Loading departments...' : 'Select Department'}</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.specialization ? `${dept.name} (${dept.specialization})` : dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="section">Section</Label>
              <select id="section" name="sectionId" value={formData.sectionId}
                onChange={handleFormChange}
                className="mt-1.5 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                required disabled={!formData.departmentId || sections.length === 0}>
                <option value="">
                  {!formData.departmentId ? 'Select Department First'
                    : sections.length === 0 ? 'No Sections Available'
                      : 'Select Section'}
                </option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full text-white font-medium py-2.5 mt-6"
              style={{ backgroundColor: '#1E3A8A' }}>
              Next: Capture Face
            </Button>
          </form>
        )}

        {/* ── STEP 2: Photo Capture ── */}
        {step === 'photo' && (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              {!photoPreview ? (
                <div className="space-y-4 p-6">
                  {/* Camera header & device selector */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CameraIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-gray-700">Capture Face Photo</span>
                    </div>
                    {devices.length > 0 && (
                      <select
                        value={selectedDeviceId}
                        onChange={e => {
                          setSelectedDeviceId(e.target.value);
                          localStorage.setItem(DEVICE_KEY, e.target.value);
                        }}
                        className="text-sm border border-gray-300 rounded-md py-1.5 px-3 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
                      >
                        {devices.map((d, i) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Video / Camera-off view */}
                  <div
                    className="bg-black/90 rounded-lg overflow-hidden flex flex-col items-center justify-center"
                    style={{ height: '380px' }}
                  >
                    {cameraActive ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400 p-8">
                        <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg mb-6">Camera is Off</p>
                        <Button
                          onClick={startCamera}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-6 flex items-center gap-2 mx-auto"
                        >
                          <Video className="w-4 h-4" />
                          Turn On Camera
                        </Button>
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={capturePhoto}
                      disabled={!cameraActive}
                      className={`flex-1 text-white font-medium py-2.5 ${!cameraActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={cameraActive ? { backgroundColor: '#10B981' } : { backgroundColor: '#9CA3AF' }}
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
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '380px' }}>
                    <img src={photoPreview} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setPhoto(null); setPhotoPreview(null); startCamera(); }}
                      style={{ borderColor: '#EF4444', color: '#EF4444' }}
                    >
                      Retake
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}
                    >
                      Choose Different
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </div>
                </div>
              )}
            </Card>

            <div className="flex gap-2">
              <Button onClick={() => setStep('form')} variant="outline" className="flex-1"
                style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}>
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

            {/* Registration Details Preview */}
            <Card className="p-4 bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2 font-medium">Registration Details:</p>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium text-gray-700">Roll Number:</span> {formData.rollNumber}</p>
                <p><span className="font-medium text-gray-700">Name:</span> {formData.name}</p>
                <p>
                  <span className="font-medium text-gray-700">Department:</span>{' '}
                  {departments.find(d => d.id.toString() === formData.departmentId)?.name || 'Not selected'}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Section:</span>{' '}
                  {sections.find(s => s.id.toString() === formData.sectionId)?.name || 'Not selected'}
                </p>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
