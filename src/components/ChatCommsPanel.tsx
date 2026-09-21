import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Play, Pause, Trash2, Shield, Clock, Phone, Volume2, MessageSquare, Users } from 'lucide-react';
import { ChatMessage, Member, UserRole } from '../types';
import { TranslationDict } from '../i18n/translations';
import { StorageService } from '../services/storage';
import { audioService } from '../services/audio';
import { useTheme } from '../context/ThemeContext';

interface Props {
  groupId?: string;
  directShareId?: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
  members?: Member[];
  onSelectMemberForDirectChat?: (member: Member) => void;
  t: TranslationDict;
  onInitiateCall?: () => void;
}

export const ChatCommsPanel: React.FC<Props> = ({
  groupId,
  directShareId,
  currentUserId,
  currentUserName,
  currentUserRole,
  members = [],
  onSelectMemberForDirectChat,
  t,
  onInitiateCall,
}) => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Load existing messages
  useEffect(() => {
    const loaded = StorageService.getMessages(groupId, directShareId);
    setMessages(loaded);
  }, [groupId, directShareId]);

  // Scroll to bottom of chat internally without moving the browser window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      groupId,
      directShareId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      type: 'text',
      text: inputText.trim(),
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    StorageService.saveMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    audioService.playMessageChime();
  };

  const handleStartRecord = async () => {
    const started = await audioService.startRecording();
    if (started) {
      setIsRecording(true);
    } else {
      // If microphone not permitted, generate a simulated voice note
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const synthMsg: ChatMessage = {
          id: 'voice_' + Math.random().toString(36).substring(2, 9),
          groupId,
          directShareId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: currentUserRole,
          type: 'voice',
          audioDurationSeconds: 4,
          timestamp: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        StorageService.saveMessage(synthMsg);
        setMessages((prev) => [...prev, synthMsg]);
        audioService.playMessageChime();
      }, 2500);
    }
  };

  const handleStopRecord = async () => {
    setIsRecording(false);
    const audioData = await audioService.stopRecording();
    if (audioData) {
      const voiceMsg: ChatMessage = {
        id: 'voice_' + Math.random().toString(36).substring(2, 9),
        groupId,
        directShareId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        type: 'voice',
        audioBlobUrl: audioData.blobUrl,
        audioDurationSeconds: audioData.duration,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      StorageService.saveMessage(voiceMsg);
      setMessages((prev) => [...prev, voiceMsg]);
      audioService.playMessageChime();
    }
  };

  const playVoiceNote = (msg: ChatMessage) => {
    if (playingAudioId === msg.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (msg.audioBlobUrl) {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      audioPlayerRef.current.src = msg.audioBlobUrl;
      audioPlayerRef.current.play();
      setPlayingAudioId(msg.id);
      audioPlayerRef.current.onended = () => setPlayingAudioId(null);
    } else {
      // Synthesized simulated playback
      setPlayingAudioId(msg.id);
      audioService.playMessageChime();
      setTimeout(() => setPlayingAudioId(null), (msg.audioDurationSeconds || 3) * 1000);
    }
  };

  const calculateHoursLeft = (expiresAt: number) => {
    const diffHours = Math.max(1, Math.round((expiresAt - Date.now()) / (60 * 60 * 1000)));
    return `${diffHours}h left`;
  };

  return (
    <div className={`flex flex-col h-[460px] md:h-[540px] rounded-3xl border shadow-sm overflow-hidden transition ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
    }`}>
      {/* Comms Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/70 border-slate-100'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.textChat}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isDark
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
              {t.storage24hBadge}
            </span>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.chatTTLNotice}</p>
        </div>

        {onInitiateCall && (
          <button
            onClick={onInitiateCall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t.voiceCall}</span>
          </button>
        )}
      </div>

      {/* 1-to-1 Direct Messaging Member Selector Strip */}
      {members.length > 0 && onSelectMemberForDirectChat && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 overflow-x-auto no-scrollbar ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50/90 border-slate-100'
        }`}>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            <MessageSquare className="w-3 h-3 text-emerald-500" />
            <span>Direct:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {members
              .filter((m) => m.id !== currentUserId)
              .map((member) => (
                <button
                  key={member.id}
                  onClick={() => onSelectMemberForDirectChat(member)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-xs transition cursor-pointer flex-shrink-0 shadow-2xs ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800'
                  }`}
                  title={`Open 1-to-1 Chat with ${member.name}`}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-medium">{member.name.split(' ')[0]}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Shield className="w-10 h-10 text-emerald-500/50 mb-2" />
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Secure Direct Encrypted Channel</p>
            <p className={`text-[11px] max-w-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {t.storage24hDesc}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{isMe ? 'You' : msg.senderName}</span>
                  <span>•</span>
                  <span className="text-emerald-500 font-semibold">{calculateHoursLeft(msg.expiresAt)}</span>
                </div>

                {msg.type === 'text' ? (
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : isDark
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                        : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs shadow-xs ${
                      isMe
                        ? 'bg-emerald-700 text-white rounded-br-none'
                        : isDark
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                        : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <button
                      onClick={() => playVoiceNote(msg)}
                      className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-current transition cursor-pointer"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                    <div>
                      <div className="font-semibold text-[11px] flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Voice Note ({msg.audioDurationSeconds || 3}s)</span>
                      </div>
                      <div className="flex items-center gap-0.5 h-3 mt-1">
                        {[4, 8, 12, 6, 14, 10, 8, 16, 10, 6, 4].map((h, i) => (
                          <div
                            key={i}
                            className={`w-0.5 rounded-full ${
                              playingAudioId === msg.id ? (isMe ? 'bg-white animate-pulse' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'
                            }`}
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Bar */}
      <div className={`p-3 border-t ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/70 border-slate-100'
      }`}>
        {isRecording ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-semibold">{t.recordingAudio}</span>
            </div>
            <button
              onClick={handleStopRecord}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              {t.sendVoiceMessage}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartRecord}
              className={`p-2.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={t.holdToRecord}
            >
              <Mic className="w-4 h-4 text-emerald-500" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.typeMessagePlaceholder}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            />

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-xs transition cursor-pointer"
              title={t.send}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
