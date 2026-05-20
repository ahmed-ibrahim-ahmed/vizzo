/**
 * @vizzo/admin — ReceiptViewer Component
 * Premium canvas-based image verification tool for manual Bank of Khartoum receipts.
 * Includes interactive 90-degree rotation, multi-stage zoom controls, and approval mutations.
 */

import { useEffect, useRef, useState } from 'react';

interface ReceiptViewerProps {
  imageUrl: string;
  storeName: string;
  tier: 'monthly' | 'quarterly' | 'annual';
  amountUsd: number;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function ReceiptViewer({
  imageUrl,
  storeName,
  tier,
  amountUsd,
  onApprove,
  onReject,
  onClose,
}: ReceiptViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load Image
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Avoid CORS issues if loaded from external bucket
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setRotation(0);
      setZoom(1);
    };
    img.onerror = () => {
      console.error('[ReceiptViewer] Failed to load receipt image:', imageUrl);
    };
  }, [imageUrl]);

  // Render Canvas with Rotations and Zooms
  useEffect(() => {
    if (!imageLoaded || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Set rotated dimension metrics
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const displayWidth = isRotated90or270 ? img.height : img.width;
    const displayHeight = isRotated90or270 ? img.width : img.height;

    // Scale canvas to fit viewport nicely while keeping high definition
    const maxViewportWidth = 500;
    const scaleFactor = Math.min(1, maxViewportWidth / displayWidth);

    canvas.width = displayWidth * scaleFactor;
    canvas.height = displayHeight * scaleFactor;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Center translation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    // Zoom scale
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);
    // Draw
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    ctx.restore();
  }, [imageLoaded, rotation, zoom]);

  const handleRotate = () => {
    setRotation((prev) => ((prev + 90) % 360) as any);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.4, prev - 0.2));
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
  };

  const getTierTranslation = (t: string) => {
    switch (t) {
      case 'annual': return 'سنوي (365 يوم)';
      case 'quarterly': return 'ربع سنوي (90 يوم)';
      default: return 'شهري (30 يوم)';
    }
  };

  return (
    <div className="receipt-modal-overlay">
      <div className="receipt-modal-card">
        <div className="modal-header">
          <h2>مراجعة إيصال التحويل البنكي</h2>
          <button className="close-modal-btn" onClick={onClose} type="button">✕</button>
        </div>

        <div className="modal-body">
          {/* Metadata Sidebar */}
          <div className="receipt-details-sidebar">
            <div className="detail-item">
              <span className="detail-label">المتجر المطلوب ترقيته:</span>
              <span className="detail-value text-glow">{storeName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">الباقة المطلوبة:</span>
              <span className="detail-value tier-badge">{getTierTranslation(tier)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">المبلغ المعادل:</span>
              <span className="detail-value amount-usd">${amountUsd} USD</span>
            </div>
            
            <div className="canvas-tools-panel">
              <h4 className="tools-title">أدوات فحص المستند</h4>
              <div className="tools-grid">
                <button className="tool-btn" onClick={handleZoomIn} title="تكبير">🔍+</button>
                <button className="tool-btn" onClick={handleZoomOut} title="تصغير">🔍-</button>
                <button className="tool-btn" onClick={handleRotate} title="تدوير 90 درجة">🔄 تدوير</button>
                <button className="tool-btn" onClick={handleReset} title="إعادة تعيين">🔁 تصفير</button>
              </div>
            </div>

            <div className="modal-actions-container">
              <button 
                className="action-btn-primary approve-action"
                onClick={onApprove}
                disabled={loadingAction}
                type="button"
              >
                ✓ اعتماد وتنشيط الاشتراك
              </button>
              <button 
                className="action-btn-secondary reject-action"
                onClick={onReject}
                disabled={loadingAction}
                type="button"
              >
                ✕ رفض إيصال التحويل
              </button>
            </div>
          </div>

          {/* Canvas Render Panel */}
          <div className="canvas-render-container">
            {!imageLoaded ? (
              <div className="canvas-loader">
                <span className="loader-spinner"></span>
                <p>جاري تحميل مستند الإيصال فائق الجودة...</p>
              </div>
            ) : (
              <div className="canvas-wrapper">
                <canvas ref={canvasRef} className="receipt-canvas" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
