import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Play,
  Pause,
  Phone,
  Video,
  X,
  ShieldCheck,
  MapPin,
  Battery,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { Member, ChatMessage, UserRole } from '../types';
import { TranslationDict } from '../i18n/translations';
import { StorageService } from '../services/storage';
import { audioService } from '../services/audio';
import { calculateDistanceKm } from '../utils/geo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recipient: Member | null;
  currentUser: Member;
  currentUserRole: UserRole;
  onStartVoiceCall?: (recipient: Member, isVideo?: boolean) => void;
  t: TranslationDict;
}

const QUICK_PROMPTS = [
  "📍 What's your current ETA?",
  '✅ Reached destination safely!',
  '🔋 Please check your battery level',
  '🚗 Heading your way now',
  '❓ Are you at the safe zone?',
];

const AUTO_REPLIES: Record<string, string[]> = {
  mem_leo: [
    'Got it! Traffic is clear, ETA is around 10 minutes.',
    'Acknowledged! Just leaving the campus now.',
    'All safe here! Battery is good.',
    'Will check in again once I reach the next stop.',
  ],
  mem_david: [
    'Delivery package in transit. 2 drops remaining on this street.',
    'Delivery route is on schedule, ETA 12 mins.',
    'Copy that, dispatcher. Standing by at the hub.',
  ],
  mem_emma: [
    'Everything is peaceful here at home, thank you for checking!',
    'Received your note. See you soon!',
  ],
  mem_sarah: [
    'Admin copy, location telemetry logged. Stay safe!',
    'Route verified on dispatch map. Looking good!',
  ],
};

export const DirectChatModal: React.FC<Props> = ({
  isOpen,
  onClose,
  recipient,
  currentUser,
  currentUserRole,
  onStartVoiceCall,
  t,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load message thread between currentUser and recipient
  useEffect(() => {
    if (isOpen && recipient) {
      const loaded = StorageService.getMessages(undefined, undefined, {
        userA: currentUser.id,
        userB: recipient.id,
      });
      setMessages(loaded);

      // Auto focus input
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, recipient, currentUser.id]);

  // Scroll to bottom of modal chat internally
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!isOpen || !recipient) return null;

  // Calculate distance between user and recipient
  const distanceKm =
    currentUser.lat && currentUser.lng && recipient.lat && recipient.lng
      ? calculateDistanceKm(currentUser.lat, currentUser.lng, recipient.lat, recipient.lng).toFixed(1)
      : null;

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUserRole,
      recipientId: recipient.id,
      recipientName: recipient.name,
      type: 'text',
      text: text.trim(),
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    StorageService.saveMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    audioService.playMessageChime();

    // Trigger realistic auto-reply after 1.5 seconds
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const possibleReplies = AUTO_REPLIES[recipient.id] || [
        `Understood! Received your message loud and clear.`,
        `Got it! Current location is updated on map.`,
      ];
      const replyText =
        possibleReplies[Math.floor(Math.random() * possibleReplies.length)];

      const replyMsg: ChatMessage = {
        id: 'msg_reply_' + Date.now(),
        senderId: recipient.id,
        senderName: recipient.name,
        senderRole: recipient.role,
        recipientId: currentUser.id,
        recipientName: currentUser.name,
        type: 'text',
        text: replyText,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      StorageService.saveMessage(replyMsg);
      setMessages((prev) => [...prev, replyMsg]);
      audioService.playMessageChime();
    }, 1400);
  };

  const handleRecordVoiceNote = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      const audioData = await audioService.stopRecording();
      const voiceMsg: ChatMessage = {
        id: 'voice_' + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUserRole,
        recipientId: recipient.id,
        recipientName: recipient.name,
        type: 'voice',
        audioBlobUrl: audioData?.blobUrl || undefined,
        audioDurationSeconds: audioData?.duration || 4,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      StorageService.saveMessage(voiceMsg);
      setMessages((prev) => [...prev, voiceMsg]);
      audioService.playMessageChime();
    } else {
      // Start recording
      const started = await audioService.startRecording();
      setIsRecording(true);
      if (!started) {
        // If microphone denied, synthesize 3s push-to-talk note
        setTimeout(() => {
          setIsRecording(false);
          const synthMsg: ChatMessage = {
            id: 'voice_' + Date.now(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderRole: currentUserRole,
            recipientId: recipient.id,
            recipientName: recipient.name,
            type: 'voice',
            audioDurationSeconds: 3,
            timestamp: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };
          StorageService.saveMessage(synthMsg);
          setMessages((prev) => [...prev, synthMsg]);
          audioService.playMessageChime();
        }, 2500);
      }
    }
  };

  const togglePlayAudio = (msgId: string, url?: string) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      if (url) {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio(url);
        } else {
          audioPlayerRef.current.src = url;
        }
        audioPlayerRef.current.play();
        audioPlayerRef.current.onended = () => setPlayingAudioId(null);
      } else {
        // Simulated playback of 3s voice note
        audioService.playConsentChime();
        setTimeout(() => setPlayingAudioId(null), 3000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[92vh] text-slate-800">
        {/* Header with Recipient Profile, Battery & Voice Call */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={recipient.avatar}
                alt={recipient.name}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
              <div
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  recipient.isSharingLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{recipient.name}</h3>
                {recipient.role === 'admin' ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {t.badgeAdmin}
                  </span>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {t.roleMember}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                {distanceKm && (
                  <span className="flex items-center gap-1 text-cyan-600 font-medium">
                    <MapPin className="w-3 h-3" />
                    <span>{distanceKm} km</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Battery className="w-3 h-3 text-slate-400" />
                  <span>{recipient.battery || 85}%</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onStartVoiceCall && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onStartVoiceCall(recipient, false);
                  }}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title={`${t.voiceCall} ${recipient.name}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.voiceCall}</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onStartVoiceCall(recipient, true);
                  }}
                  className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title={`Video Call ${recipient.name}`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Video</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 24-Hour Privacy Reminder Tag */}
        <div className="px-4 py-1.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-[10px] text-emerald-800">
          <div className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.storage24hBadge}</span>
          </div>
          <span className="text-slate-500">{t.zeroKnowledge}</span>
        </div>

        {/* Message Thread History */}
        <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-emerald-500 opacity-60" />
              <p className="text-xs text-slate-600 font-medium">{t.textChat}: {recipient.name}</p>
              <p className="text-[11px] text-slate-400">
                {t.typeMessagePlaceholder}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-1.5 max-w-[82%]">
                    {!isMine && (
                      <img
                        src={recipient.avatar}
                        alt={recipient.name}
                        className="w-6 h-6 rounded-full object-cover mb-1 border border-slate-200 shadow-2xs"
                      />
                    )}

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isMine
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                      }`}
                    >
                      {msg.type === 'voice' ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePlayAudio(msg.id, msg.audioBlobUrl)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                              isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div>
                            <div className="font-bold text-[11px]">
                              Voice Note ({msg.audioDurationSeconds || 3}s)
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`w-1 h-3 rounded-full animate-pulse ${isMine ? 'bg-white/60' : 'bg-emerald-500'}`} />
                              <span className={`w-1 h-4 rounded-full ${isMine ? 'bg-white/80' : 'bg-emerald-600'}`} />
                              <span className={`w-1 h-2 rounded-full ${isMine ? 'bg-white/60' : 'bg-emerald-500'}`} />
                              <span className={`w-1 h-5 rounded-full animate-pulse ${isMine ? 'bg-white' : 'bg-emerald-700'}`} />
                              <span className={`w-1 h-3 rounded-full ${isMine ? 'bg-white/60' : 'bg-emerald-500'}`} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                    <span>{formattedTime}</span>
                    {isMine && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              <span>{recipient.name} is replying...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Carousel */}
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 text-[11px] text-slate-700 hover:text-emerald-700 transition cursor-pointer flex-shrink-0 shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Input & Push-to-talk Voice Recording Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={handleRecordVoiceNote}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
            title={isRecording ? 'Stop Recording' : 'Record Push-to-Talk Voice Note'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Message ${recipient.name}...`}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-xs transition cursor-pointer"
            title={t.send}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
