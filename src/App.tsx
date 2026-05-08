/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Share2, 
  Zap, 
  ZapOff,
  RefreshCcw,
  Palette,
  Activity,
  Globe,
  Camera,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from './lib/utils';
import { remixImage, REMIX_STYLES, StyleId, tellArtifactStory, ArtifactStory } from './services/gemini';
import { ComparisonSlider } from './components/ComparisonSlider';
import { HeritageStoryModal } from './components/HeritageStoryModal';

// --- Sub-components ---

const HighlightText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={i} className="text-white font-black bg-white/10 px-1 rounded">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const StyleItem = ({ 
  style, 
  isSelected, 
  onSelect 
}: { 
  style: typeof REMIX_STYLES[StyleId]; 
  isSelected: boolean; 
  onSelect: () => void;
  key?: string;
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case "truck-art": return "🛺";
      case "mughal": return "🕌";
      case "multani-blue": return "💠";
      case "phulkari": return "🧵";
      default: return "🎨";
    }
  };

  const getColorClass = (id: string) => {
    switch (id) {
      case "truck-art": return "bg-gradient-to-br from-truck-orange to-truck-yellow";
      case "mughal": return "bg-gradient-to-br from-zinc-700 to-zinc-900";
      case "multani-blue": return "bg-gradient-to-br from-neon-blue to-teal-500";
      case "phulkari": return "bg-gradient-to-br from-pink-600 to-amber-500";
      default: return "bg-neon-pink";
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 p-4 border rounded-[20px] transition-all duration-500 text-left w-full group relative overflow-hidden",
        isSelected 
          ? "bg-neon-green/10 border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.2)]" 
          : "border-white/5 hover:border-white/20 bg-white/[0.02]"
      )}
    >
      {isSelected && (
        <motion.div 
          layoutId="active-style-glow"
          className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"
        />
      )}
      <div className={cn(
        "w-14 h-14 flex items-center justify-center rounded-2xl text-2xl flex-shrink-0 shadow-lg group-hover:rotate-6 transition-transform duration-500",
        getColorClass(style.id)
      )}>
        {getIcon(style.id)}
      </div>
      <div className="relative z-10">
        <div className="font-bold text-[15px] leading-tight text-white tracking-tight">{style.name}</div>
        <div className="text-[10px] opacity-40 uppercase tracking-[0.1em] font-mono mt-1">{style.description}</div>
      </div>
      {isSelected && (
        <div className="ml-auto">
          <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
        </div>
      )}
    </motion.button>
  );
};

const BentoCard = ({ 
  title, 
  children, 
  className,
  borderColor 
}: { 
  title: string; 
  children: ReactNode; 
  className?: string;
  borderColor?: string;
}) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={cn("bento-card border-white/[0.08] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-xl", className)} 
    style={{ borderColor }}
  >
    <div className="bento-card-title flex items-center justify-between">
      <span>{title}</span>
      <div className="w-1 h-1 rounded-full bg-white/20" />
    </div>
    {children}
  </motion.section>
);

// --- Main App ---

export default function App() {
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("TRUCK_ART");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStory, setShowStory] = useState<StyleId | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [currentTab, setCurrentTab] = useState<'REMIX' | 'STORYTELLER'>('REMIX');
  const [artifactStory, setArtifactStory] = useState<ArtifactStory | null>(null);
  const [zoom, setZoom] = useState(1);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraCapabilities, setCameraCapabilities] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("FILE_TOO_LARGE: Max size is 10MB");
        return;
      }

      setError(null);
      setResult(null);
      setPreview(URL.createObjectURL(selectedFile));

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (base64) {
          setFileData({ base64, mimeType: selectedFile.type });
        } else {
          setError("Failed to extract image data.");
        }
      };
      reader.onerror = () => setError("Could not read file reliably.");
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const handleRemix = async () => {
    if (!fileData) return;
    setIsProcessing(true);
    setError(null);
    try {
      if (currentTab === 'REMIX') {
        const remixedUrl = await remixImage(fileData.base64, fileData.mimeType, selectedStyle);
        setResult(remixedUrl);

        // Check if this style has been seen before
        const seenKey = `seen-story-${selectedStyle}`;
        if (!localStorage.getItem(seenKey)) {
          setShowStory(selectedStyle);
          localStorage.setItem(seenKey, 'true');
        }
      } else {
        const story = await tellArtifactStory(fileData.base64, fileData.mimeType);
        setArtifactStory(story);
      }
    } catch (err: any) {
      setError(err?.message || "Operation failed. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `virsa-ai-${selectedStyle.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (currentTab === 'REMIX') {
      if (!result) return;
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
      
      try {
        const response = await fetch(result);
        const blob = await response.blob();
        const file = new File([blob], 'virsa-ai-remix.png', { type: 'image/png' });

        if (navigator.share) {
          await navigator.share({
            title: 'My Virsa AI Remix',
            text: `Check out my cultural remix in ${REMIX_STYLES[selectedStyle].name} style!`,
            files: [file],
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          alert('App link copied to clipboard!');
        }
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    } else {
      if (!artifactStory) return;
      try {
        const shareText = `Check out this Pakistani Artifact analysis by VirsaAI:
        
Artifact: ${artifactStory.identificationAndStatus}
History: ${artifactStory.originsAndEvolution}
Symbolism: ${artifactStory.patternAndSymbolism}
Authenticity: ${artifactStory.technicalSignature}
        
Historical Fact: ${artifactStory.didYouKnow}`;

        if (navigator.share) {
          const shareData: any = {
            title: 'VirsaAI Heritage Analysis',
            text: shareText,
          };

          // If we have a preview image (the original photo), try to share it too
          if (preview) {
             try {
                const response = await fetch(preview);
                const blob = await response.blob();
                const file = new File([blob], 'artifact-analysis.png', { type: 'image/png' });
                shareData.files = [file];
             } catch (e) {
                console.warn("Could not attach image to share:", e);
             }
          }

          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareText);
          alert('Heritage analysis copied to clipboard!');
        }
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    }
  };

  const reset = () => {
    setFileData(null);
    setPreview(null);
    setResult(null);
    setArtifactStory(null);
    setError(null);
    stopCamera();
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setIsCameraActive(true);
    setCameraError(null);
    setCameraCapabilities(null);
    setZoom(1);
    setTorchOn(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait a bit for track to initialize
        setTimeout(() => {
          const track = stream.getVideoTracks()[0];
          if (track) {
            const caps = (track as any).getCapabilities?.() || {};
            setCameraCapabilities(caps);
          }
        }, 500);
      }
    } catch (err: any) {
      console.error("Camera access denied:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera blocked. Please click the camera icon in your browser address bar to 'Allow' access, or try opening the app in a new tab.");
      } else {
        setCameraError("Camera unavailable. Please check if another app is using it or try opening in a new tab.");
      }
      setIsCameraActive(false);
    }
  };

  const updateCameraConstraints = useCallback((constraints: any) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
      if (track && (track as any).applyConstraints) {
        (track as any).applyConstraints({ advanced: [constraints] }).catch(console.error);
      }
    }
  }, []);

  const handleZoomChange = (val: number) => {
    setZoom(val);
    updateCameraConstraints({ zoom: val });
  };

  const toggleTorch = () => {
    const newState = !torchOn;
    setTorchOn(newState);
    updateCameraConstraints({ torch: newState });
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isCameraActive) {
      startCamera(newMode);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        setPreview(dataUrl);
        setFileData({ base64, mimeType: 'image/png' });
        stopCamera();
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep p-6 flex flex-col gap-6 font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b-2 border-neon-pink pb-4 shrink-0 px-2 gap-4">
        <div className="font-display text-5xl tracking-tight uppercase bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent">
          VIRSA.AI
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setCurrentTab('REMIX'); reset(); }}
            className={cn(
              "chip transition-all",
              currentTab === 'REMIX' ? "!border-neon-pink !text-neon-pink bg-neon-pink/10" : "opacity-60 hover:opacity-100"
            )}
          >
            Remix Mode
          </button>
          <button 
            onClick={() => { setCurrentTab('STORYTELLER'); reset(); }}
            className={cn(
              "chip transition-all",
              currentTab === 'STORYTELLER' ? "!border-neon-blue !text-neon-blue bg-neon-blue/20" : "opacity-60 hover:opacity-100"
            )}
          >
            Artifact Storyteller
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-grow auto-rows-min">
        
        {/* HERO CARD: Workspace */}
        <BentoCard 
          title="AI Workspace" 
          className={cn(
            "md:row-span-1 !border-neon-pink/50 neon-glow-pink relative",
            currentTab === 'REMIX' ? "md:col-span-7 lg:col-span-7" : "md:col-span-12 lg:col-span-6"
          )}
        >
          <div className="flex-grow flex flex-col justify-center items-center p-8 text-center gap-6">
            {!preview ? (
              <div className="w-full h-80 flex flex-col gap-4">
                {isCameraActive ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black border-2 border-neon-green">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className={cn("w-full h-full object-cover", facingMode === 'user' && "mirror")}
                      style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                    />
                    
                    {/* Zoom Slider Overlay */}
                    {cameraCapabilities?.zoom && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 bg-black/40 p-2 rounded-full backdrop-blur-sm">
                        <Plus className="w-4 h-4 text-white/60" />
                        <input 
                          type="range"
                          min={cameraCapabilities.zoom.min || 1}
                          max={cameraCapabilities.zoom.max || 3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                          className="h-32 accent-neon-green"
                          style={{ appearance: 'slider-vertical', width: '4px' }}
                        />
                        <Minus className="w-4 h-4 text-white/60" />
                      </div>
                    )}

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6">
                      <button 
                        onClick={toggleCamera}
                        className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white border border-white/20"
                        title="Switch Camera"
                      >
                        <RefreshCcw className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={capturePhoto}
                        className="w-14 h-14 bg-white rounded-full border-4 border-neon-green flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <div className="w-10 h-10 bg-neon-green rounded-full" />
                      </button>

                      {cameraCapabilities?.torch && (
                        <button 
                          onClick={toggleTorch}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                            torchOn ? "bg-neon-green text-black border-neon-green" : "bg-black/60 text-white border-white/20"
                          )}
                          title="Toggle Flash/Torch"
                        >
                          {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                        </button>
                      )}

                      {!cameraCapabilities?.torch && (
                        <button 
                          onClick={stopCamera}
                          className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Desktop/Alternative Close Button if Torch exists */}
                    {cameraCapabilities?.torch && (
                       <button 
                        onClick={stopCamera}
                        className="absolute top-4 left-4 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 w-full h-full">
                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "flex-grow border-2 border-dashed border-neon-blue rounded-2xl flex items-center justify-center bg-white/5 transition-all cursor-pointer group hover:bg-white/10",
                        isDragActive && "border-neon-green bg-neon-green/5"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="opacity-50 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                        <Upload className="w-10 h-10 mb-2 text-neon-blue" />
                        <p className="font-display text-xl tracking-wide">DROP IMAGE</p>
                      </div>
                    </div>
                    <button 
                      onClick={startCamera}
                      className="h-16 border-2 border-neon-green rounded-2xl flex items-center justify-center gap-3 bg-neon-green/10 hover:bg-neon-green/20 transition-all font-display text-lg tracking-widest text-neon-green"
                    >
                      <Camera className="w-6 h-6" />
                      OPEN LIVE CAMERA
                    </button>
                    {cameraError && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-neon-pink font-mono uppercase px-4">{cameraError}</p>
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => startCamera()}
                            className="text-[10px] font-bold text-white bg-white/10 px-3 py-1 rounded-full uppercase hover:bg-white/20 transition-all border border-white/20"
                          >
                            Retry
                          </button>
                        </div>
                        <p className="text-[8px] text-white/30 uppercase tracking-tighter">Tip: Try clicking the "Open in new tab" icon at the top right</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-64 md:h-72 relative rounded-2xl overflow-hidden border border-white/10 ">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <button onClick={reset} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full hover:bg-black transition-colors">
                  <RefreshCcw className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <div className="space-y-6 max-w-sm">
              {isProcessing && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                  <p className="text-[10px] font-mono tracking-[0.3em] text-neon-green uppercase">
                    PROCESING_MATRIX...
                  </p>
                </div>
              )}

              <button 
                onClick={handleRemix}
                disabled={!fileData || isProcessing}
                className={cn(
                  "upload-btn !rounded-[12px] px-10 py-4 font-black transition-all w-full",
                  isProcessing ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95",
                  currentTab === 'REMIX' ? "neon-glow-pink" : "neon-glow-blue !bg-neon-blue/80"
                )}
                style={{ backgroundColor: currentTab === 'REMIX' ? 'var(--color-neon-pink)' : undefined }}
              >
                {isProcessing ? (currentTab === 'REMIX' ? 'GENERATING ART...' : 'ANALYZING...') : (currentTab === 'REMIX' ? 'START AI GENERATION' : 'TELL THE STORY')}
              </button>
              {error && (
                <div className={cn(
                  "p-3 rounded-lg border text-[10px] font-mono uppercase text-center mt-2",
                  error.includes("QUOTA") 
                    ? "bg-truck-orange/20 border-truck-orange text-truck-orange animate-pulse" 
                    : "bg-neon-pink/20 border-neon-pink text-neon-pink"
                )}>
                  {error.includes("QUOTA") ? "⚠️ AI QUOTA REACHED! PLEASE WAIT A FEW MINUTES..." : error}
                </div>
              )}
            </div>
          </div>
          <div className="truck-art-trim mt-auto" />
        </BentoCard>

        {/* RIGHT SIDE PANEL: ARTIFACT STORY OR STYLE PICKER */}
        {currentTab === 'REMIX' ? (
          <BentoCard title="Select Style Heritage" className="md:col-span-12 lg:col-span-5 p-6 pt-0 space-y-4">
            <div className="flex flex-col gap-3 mt-4">
              {(Object.keys(REMIX_STYLES) as StyleId[]).map((id) => (
                <StyleItem 
                  key={id}
                  style={REMIX_STYLES[id]}
                  isSelected={selectedStyle === id}
                  onSelect={() => setSelectedStyle(id)}
                />
              ))}
            </div>
          </BentoCard>
        ) : (
          <BentoCard title="Historical Narrative" className="md:col-span-12 lg:col-span-6 min-h-[500px] p-6 pt-0 overflow-y-auto">
            {!artifactStory && !isProcessing ? (
              <div className="flex flex-col items-center justify-center p-20 h-full text-center opacity-40 gap-6">
                <div className="p-8 rounded-full bg-white/5 border border-white/10">
                  <Globe className="w-16 h-16" />
                </div>
                <p className="font-display text-2xl uppercase italic max-w-md">Waiting for an artifact to be scanned... History is waiting to be told.</p>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-20">
                <RefreshCcw className="w-12 h-12 animate-spin text-neon-blue" />
                <p className="font-mono text-xs uppercase tracking-[0.4em] text-neon-blue">Consulting the archives...</p>
              </div>
            ) : artifactStory ? (
              <div className="mt-8 space-y-10 text-left pb-10">
                <section className="space-y-3 relative group">
                  <div className="flex items-center gap-3 text-neon-blue">
                    <div className="w-2 h-5 bg-neon-blue rounded-full" />
                    <span className="text-[14px] font-mono uppercase tracking-[0.2em] font-black">Identification</span>
                  </div>
                  <p className="text-white text-xl md:text-2xl font-bold leading-tight tracking-tight">
                    <HighlightText text={artifactStory.identificationAndStatus} />
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-3">
                    <div className="flex items-center gap-3 text-neon-pink">
                      <div className="w-2 h-5 bg-neon-pink rounded-full" />
                      <span className="text-[14px] font-mono uppercase tracking-[0.2em] font-black">Origins</span>
                    </div>
                    <p className="text-white/80 text-base leading-relaxed">
                      <HighlightText text={artifactStory.originsAndEvolution} />
                    </p>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-3 text-truck-orange">
                      <div className="w-2 h-5 bg-truck-orange rounded-full" />
                      <span className="text-[14px] font-mono uppercase tracking-[0.2em] font-black">Symbolism</span>
                    </div>
                    <p className="text-white/80 text-base leading-relaxed">
                      <HighlightText text={artifactStory.patternAndSymbolism} />
                    </p>
                  </section>
                </div>

                <section className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-neon-green" />
                    <span className="text-[14px] font-mono uppercase tracking-[0.2em] text-neon-green font-black">Technical Signature</span>
                  </div>
                  <p className="text-white/90 text-base leading-relaxed">
                    <HighlightText text={artifactStory.technicalSignature} />
                  </p>
                </section>

                <section className="p-6 rounded-2xl bg-neon-blue/5 border border-neon-blue/10 space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                     <Sparkles className="w-24 h-24" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-neon-blue" />
                    <span className="text-[14px] font-mono uppercase tracking-[0.2em] text-neon-blue font-black">Historical Fact</span>
                  </div>
                  <p className="text-white text-base leading-relaxed">
                    <HighlightText text={artifactStory.didYouKnow} />
                  </p>
                </section>

                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center p-2 border border-white/10">
                       <img src="/pkr-flag.png" alt="PK" className="w-full h-full object-cover rounded-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-30">Verified Heritage Analysis • Neural Node PK-01</div>
                  </div>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={handleShare} 
                    className="text-neon-blue flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] group"
                  >
                    Share Details <Share2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  </motion.button>
                </div>
              </div>
            ) : null}
          </BentoCard>
        )}

        {/* COLLECTION / RESULT CARD (ONLY FOR REMIX TAB) */}
        {currentTab === 'REMIX' && (
          <BentoCard 
            title={result ? "Your Remixed Result" : "Artistic Canvas"} 
            className="md:col-span-12 p-6 pt-0 min-h-[400px] md:min-h-[300px] mt-4"
          >
            <div className="flex-grow flex flex-col mt-4 max-w-lg mx-auto w-full">
              {result && preview ? (
                <div className="h-full space-y-6 flex flex-col">
                  <ComparisonSlider 
                    before={preview}
                    after={result}
                    isSharing={isSharing}
                    className="aspect-square max-h-[400px] mx-auto"
                  />
                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        className="flex-1 py-4 bg-neon-blue text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-[0.2em] text-[11px] shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        EXPORT_MASTER
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleShare}
                        className="flex-1 py-4 bg-white/5 text-white font-black rounded-2xl border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all uppercase tracking-[0.2em] text-[11px]"
                      >
                        <Share2 className="w-4 h-4" />
                        DISTRIBUTE
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-center gap-6 opacity-20">
                      <div className="h-px flex-grow bg-white" />
                      <p className="text-[9px] text-white font-mono uppercase tracking-[0.5em]">Artifact_Logic_v5.0_Secure</p>
                      <div className="h-px flex-grow bg-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-[20px] border border-white/5 flex items-center justify-center text-white/5">
                      <Palette size={40} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BentoCard>
        )}
      </main>

      {/* Heritage Story Modal */}
      {showStory && (
        <HeritageStoryModal 
          styleId={showStory} 
          onClose={() => setShowStory(null)} 
        />
      )}

      {/* FINAL FOOTER BAR */}
      <footer className="mt-16 mb-6">
        <BentoCard title="" className="bg-truck-orange !text-black flex flex-col md:flex-row items-center px-10 py-6 md:py-0 gap-6 md:gap-10 min-h-[80px]">
          <div className="marquee-container overflow-hidden whitespace-nowrap flex-grow w-full md:w-auto">
            <div className="inline-block animate-marquee font-display text-2xl uppercase">
              PAKISTAN ZINDABAD — REIMAGINING HERITAGE THROUGH NEURAL NETWORKS — TRUCK ART IS NOT A CRIME — VIRSA AI —&nbsp;
              PAKISTAN ZINDABAD — REIMAGINING HERITAGE THROUGH NEURAL NETWORKS — TRUCK ART IS NOT A CRIME — VIRSA AI —&nbsp;
            </div>
          </div>
          <div 
            onClick={handleShare}
            className="shrink-0 flex items-center gap-4 border-t md:border-t-0 md:border-l-2 border-black/20 pt-4 md:pt-0 md:pl-10 h-auto md:h-1/2 font-black text-sm uppercase tracking-widest group cursor-pointer"
          >
            SHARE APP
            <Share2 className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </BentoCard>
      </footer>
    </div>
  );
}
