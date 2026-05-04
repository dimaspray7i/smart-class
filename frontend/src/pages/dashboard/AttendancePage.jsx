import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function AttendancePage() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [code, setCode] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);

  // Get today's attendance status on mount
  useEffect(() => {
    fetchTodayStatus();
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/student/attendance/today');
      if (res?.status === 'success') {
        setTodayStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch today status:', err);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setPhoto(photoData);
    stopCamera();
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const getLocation = () => {
    setLocationError(null);
    setLocation(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung browser ini');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = 'Gagal mendapatkan lokasi';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Izin lokasi ditolak. Mohon izinkan akses lokasi.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            message = 'Waktu permintaan lokasi habis.';
            break;
          default:
            message = error.message;
        }
        setLocationError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async () => {
    // Validasi
    if (!photo) {
      alert('Mohon ambil foto terlebih dahulu');
      return;
    }
    if (!code || code.length !== 6) {
      alert('Kode absensi harus 6 karakter');
      return;
    }
    if (!location) {
      alert('Mohon aktifkan lokasi GPS');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      // Upload photo to get URL (simplified - in real app, upload to server first)
      // For now, we'll send base64 or skip photo_url if backend doesn't support it
      
      const res = await api.post('/student/attendance', {
        lat: location.lat,
        lng: location.lng,
        code: code.toUpperCase(),
        device: 'web',
        // photo_url: photo, // Uncomment if backend supports base64 or you have upload endpoint
      });

      if (res?.status === 'success') {
        setResult({
          success: true,
          message: res.message,
          data: res.data,
          meta: res.meta,
        });
        setPhoto(null);
        setCode('');
        setLocation(null);
        fetchTodayStatus(); // Refresh status
        startCamera(); // Restart camera for next use
      } else {
        throw new Error(res?.message || 'Gagal submit absensi');
      }
    } catch (err) {
      setResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat submit absensi',
        errors: err.errors,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // If already attended today
  if (todayStatus?.has_attended) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
          <h2 className="text-2xl font-bold mb-2">Anda Sudah Absen Hari Ini</h2>
          <p className="text-gray-600 dark:text-dark-muted mb-4">
            Status: <span className="font-semibold">{todayStatus.attendance?.status}</span>
          </p>
          {todayStatus.attendance && (
            <div className="text-sm text-gray-500 dark:text-dark-muted space-y-1">
              <p>Waktu: {todayStatus.attendance.check_in_time}</p>
              <p>Lokasi: {todayStatus.attendance.location_string}</p>
            </div>
          )}
          <button 
            onClick={fetchTodayStatus}
            className="btn btn-outline mt-6 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Absensi Harian</h1>
        <p className="text-gray-600 dark:text-dark-muted">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Time Window Info */}
      {todayStatus?.time_window && (
        <div className="card mb-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Waktu Absensi</h3>
              <p className="text-sm text-gray-600 dark:text-dark-muted">
                Tersedia pukul {todayStatus.time_window.open} - {todayStatus.time_window.close}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Waktu sekarang: {todayStatus.time_window.current}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Camera & Photo */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-600" />
              Foto Selfie
            </h3>
            
            {!photo ? (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <img src={photo} alt="Captured" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {!photo ? (
                <button onClick={capturePhoto} className="btn btn-primary flex-1">
                  📸 Ambil Foto
                </button>
              ) : (
                <>
                  <button onClick={retakePhoto} className="btn btn-outline flex-1">
                    🔄 Ulangi
                  </button>
                  <button onClick={() => setPhoto(null)} className="btn btn-danger flex-1">
                    ❌ Hapus
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Location Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Lokasi GPS
            </h3>
            
            {locationError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm mb-3">
                {locationError}
              </div>
            )}

            {location ? (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                <p className="font-medium">✅ Lokasi berhasil didapat</p>
                <p className="text-xs mt-1 font-mono">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-500">Akurasi: ±{Math.round(location.accuracy)}m</p>
              </div>
            ) : (
              <button onClick={getLocation} className="btn btn-outline w-full">
                📍 Dapatkan Lokasi
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Code & Submit */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Kode Absensi</h3>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Masukkan 6 digit kode"
              maxLength={6}
              className="input text-center text-2xl tracking-widest font-mono"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 dark:text-dark-muted mt-2 text-center">
              Minta kode dari guru pengampu
            </p>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`card ${result.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold mb-1">{result.success ? 'Berhasil!' : 'Gagal!'}</h4>
                  <p className="text-sm">{result.message}</p>
                  {result.meta && (
                    <div className="mt-2 text-xs space-y-1">
                      {result.meta.status && <p>Status: {result.meta.status}</p>}
                      {result.meta.distance_from_school && <p>Jarak: {result.meta.distance_from_school}</p>}
                      {result.meta.check_in_time && <p>Waktu: {result.meta.check_in_time}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !photo || !code || !location}
            className="btn btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengirim...
              </span>
            ) : (
              '✅ Submit Absensi'
            )}
          </button>

          {/* Instructions */}
          <div className="card bg-gray-50 dark:bg-dark-card/50">
            <h4 className="font-semibold mb-2">📋 Instruksi:</h4>
            <ol className="text-sm text-gray-600 dark:text-dark-muted space-y-2 list-decimal list-inside">
              <li>Ambil foto selfie dengan kamera</li>
              <li>Aktifkan GPS dan dapatkan lokasi</li>
              <li>Masukkan kode absensi dari guru</li>
              <li>Klik "Submit Absensi"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}