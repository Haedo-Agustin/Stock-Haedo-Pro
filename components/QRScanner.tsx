import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

// Global definition for jsQR loaded via CDN
declare const jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(true);

  const startScan = async () => {
    setError('');
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo acceder a la cámara. Verifique los permisos.');
      setScanning(false);
    }
  };

  const stopScan = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    startScan();
    return () => stopScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tick = () => {
    if (!scanning) return;
    
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Attempt to scan if jsQR is available
        if (typeof jsQR !== 'undefined') {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
             // Found QR
             stopScan();
             onScan(code.data);
             return; 
          }
        }
      }
    }
    
    if (scanning) {
      requestAnimationFrame(tick);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button onClick={onClose} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30">
          <X size={24} />
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative">
        <div className="bg-slate-800 p-4 flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Camera size={20} />
            Escáner QR
          </h3>
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>
        
        <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
          {!error && (
            <>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Overlay guides */}
              <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-lg m-12 animate-pulse pointer-events-none"></div>
              <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            </>
          )}
          {error && (
             <div className="text-center p-8">
               <p className="text-slate-400 text-sm mb-4">Cámara no disponible</p>
               <button onClick={startScan} className="text-indigo-400 flex items-center justify-center gap-2">
                 <RefreshCw size={16} /> Reintentar
               </button>
             </div>
          )}
        </div>

        <div className="p-4 bg-slate-800 text-center">
          <p className="text-sm text-slate-400 mb-3">Apunte la cámara al código QR del producto</p>
          
          {/* Simulation button for demo purposes if camera fails or no QR handy */}
          <div className="flex justify-center gap-2">
            <button 
              onClick={() => { stopScan(); onScan('7790001'); }} // Simulates finding product 1
              className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
            >
              Simular Prod. 1
            </button>
            <button 
              onClick={() => { stopScan(); onScan('7790002'); }} // Simulates finding product 2
              className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
            >
              Simular Prod. 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
