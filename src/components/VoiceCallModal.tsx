import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Shield,
  User,
  SwitchCamera,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { VoiceCallState } from '../types';
import { TranslationDict } from '../i18n/translations';
import { audioService } from '../services/audio';

interface Props {
  callState: VoiceCallState;
  onAnswer: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  t: TranslationDict;
}

export const VoiceCallModal: React.FC<Props> = ({
  callState,
  onAnswer,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  t,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState<boolean>(Boolean(callState.isVideo));
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Start real device camera feed when video mode is on and call is answered
  const startCamera = async (facingMode: 'user' | 'environment') => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // audio handled separately in WebRTC / AudioService
      });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access unavailable or declined:', err);
      setCameraError('Camera access not permitted or unavailable');
    }
  };

  // Switch between front and back camera
  const handleToggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    if (isVideoActive) {
      startCamera(nextFacing);
    }
  };

  // Toggle Video Mode on/off during call
  const handleToggleVideo = () => {
    if (isVideoActive) {
      stopCameraStream();
      setIsVideoActive(false);
    } else {
      setIsVideoActive(true);
      startCamera(cameraFacing);
    }
  };

  // Synchronize camera lifecycle with call state
  useEffect(() => {
    if (callState.isOpen && callState.connected && isVideoActive) {
      startCamera(cameraFacing);
    } else if (!callState.isOpen || !callState.connected) {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [callState.isOpen, callState.connected, isVideoActive]);

  // Call timer and ringtone handling
  useEffect(() => {
    let timer: number | null = null;
    if (callState.isOpen && callState.connected) {
      audioService.stopMobileRingtone();
      timer = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (callState.isOpen && !callState.connected) {
      audioService.startMobileRingtone();
    } else {
      audioService.stopMobileRingtone();
      setSeconds(0);
      setIsVideoActive(Boolean(callState.isVideo));
    }

    return () => {
      audioService.stopMobileRingtone();
      if (timer) clearInterval(timer);
    };
  }, [callState.isOpen, callState.connected]);

  if (!callState.isOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`relative w-full ${
        isVideoActive && callState.connected ? 'max-w-xl' : 'max-w-sm'
      } rounded-[36px] bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center text-white transition-all duration-300`}>
        
        {/* Top privacy bar */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800 text-[11px] text-emerald-400 font-semibold shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.zeroKnowledge} P2P</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5">
              {isVideoActive ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <Phone className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isVideoActive ? 'Video Call' : 'Voice Call'}</span>
            </span>
          </div>
        </div>

        {/* =========================================================================
            ACTIVE VIDEO FEED MODE (WHEN VIDEO IS ENABLED & CONNECTED)
            ========================================================================= */}
        {isVideoActive && callState.connected ? (
          <div className="w-full space-y-4 my-2">
            {/* Main Remote Video Screen (Simulated peer stream) */}
            <div className="relative w-full aspect-video sm:aspect-16/10 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
              {/* Simulated high-definition remote video with subtle dynamic motion */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 z-10" />
              
              <img
                src={callState.callerAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80'}
                alt={callState.callerName}
                className="w-full h-full object-cover filter brightness-95"
              />

              {/* Top overlay details on video */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black tracking-wide text-white drop-shadow-md">
                  {callState.callerName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-emerald-400 font-bold">
                  HD 1080p
                </span>
              </div>

              {/* Live Picture-in-Picture Self Camera View */}
              <div className="absolute bottom-4 right-4 z-20 w-28 sm:w-36 aspect-3/4 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                {cameraError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-[10px] text-slate-400 bg-slate-950">
                    <VideoOff className="w-5 h-5 text-rose-400 mb-1" />
                    <span>Camera off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                )}

                {/* Flip camera button */}
                <button
                  onClick={handleToggleCameraFacing}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
                  title="Flip camera"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Call Timer Overlay */}
              <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-emerald-400 font-mono text-xs font-extrabold flex items-center gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{formatDuration(seconds)}</span>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             AUDIO / VOICE CALL AVATAR MODE
             ========================================================================= */
          <>
            {/* Avatar with pulsing rings */}
            <div className="relative my-4">
              {!callState.connected && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-emerald-500/10 animate-pulse" />
                </>
              )}
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-500/70 shadow-2xl bg-slate-800 mx-auto">
                {callState.callerAvatar ? (
                  <img src={callState.callerAvatar} alt={callState.callerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>

            {/* Name & Role */}
            <h3 className="text-2xl font-black text-white mt-2">{callState.callerName}</h3>
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              {callState.callerRole === 'admin' ? t.badgeAdmin : t.roleMember}
            </p>

            {/* Status or timer */}
            <div className="mt-3 text-sm font-mono font-medium">
              {callState.connected ? (
                <div className="text-emerald-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{formatDuration(seconds)}</span>
                </div>
              ) : (
                <div className="text-slate-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{t.callRinging}</span>
                </div>
              )}
            </div>

            {/* Live Audio Waveform animation when connected */}
            {callState.connected && (
              <div className="flex items-center justify-center gap-1.5 h-8 my-6">
                {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-emerald-500 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDuration: `${0.6 + (i % 3) * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            CONTROL ACTIONS (ANSWER, DECLINE, MUTE, SPEAKER, VIDEO TOGGLE, END)
            ========================================================================= */}
        <div className="w-full mt-6">
          {callState.connected ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* Toggle Video Button */}
                <button
                  onClick={handleToggleVideo}
                  className={`p-4 rounded-full border transition cursor-pointer ${
                    isVideoActive
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isVideoActive ? 'Turn off camera' : 'Turn on camera (Video Call)'}
                >
                  {isVideoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                {/* Mute Mic Button */}
                <button
                  onClick={onToggleMute}
                  className={`p-4 rounded-full border transition cursor-pointer ${
                    callState.muted
                      ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={t.mute}
                >
                  {callState.muted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Speaker Toggle Button */}
                <button
                  onClick={onToggleSpeaker}
                  className={`p-4 rounded-full border transition cursor-pointer ${
                    callState.speaker
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={t.speaker}
                >
                  {callState.speaker ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              {/* End Call Button */}
              <button
                onClick={() => {
                  stopCameraStream();
                  onEndCall();
                }}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-98"
              >
                <PhoneOff className="w-5 h-5" />
                <span>{t.endCall}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around gap-6">
              {/* Decline Button */}
              <button
                onClick={() => {
                  stopCameraStream();
                  onEndCall();
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="p-4 rounded-full bg-rose-600 group-hover:bg-rose-500 text-white shadow-lg transition">
                  <PhoneOff className="w-6 h-6" />
                </div>
                <span className="text-xs text-slate-400 font-medium">{t.decline}</span>
              </button>

              {/* Answer Button */}
              <button
                onClick={onAnswer}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="p-4 rounded-full bg-emerald-600 group-hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 transition animate-bounce">
                  <Phone className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-xs text-emerald-400 font-bold">{t.answerCall}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
