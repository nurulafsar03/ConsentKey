import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Download,
  Upload,
  FileText,
  Copy,
  Check,
  Share2,
  Lock,
  Zap,
  ShieldCheck,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  HardDriveDownload,
  Eye,
  MessageCircle,
  PhoneCall
} from 'lucide-react';
import { P2PTransferService, formatBytes, generate6DigitCode } from '../services/p2pTransferService';
import { P2PFilePayload, P2PTransferStatus } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  initialMode?: 'send' | 'receive';
  initialCode?: string;
}

export const P2PTransferModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isDark,
  initialMode = 'send',
  initialCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>(initialMode);
  
  // Sender state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [senderName, setSenderName] = useState<string>('You');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [transferStatus, setTransferStatus] = useState<P2PTransferStatus>('idle');
  const [senderError, setSenderError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Receiver state
  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [receivedFile, setReceivedFile] = useState<P2PFilePayload | null>(null);
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setSenderError(null);
      setReceiveError(null);
      if (initialCode) {
        setInputCode(initialCode);
      }
    }
  }, [isOpen, initialMode, initialCode]);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setGeneratedCode('');
      setTransferStatus('idle');
      setSenderError(null);
    }
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setGeneratedCode('');
      setTransferStatus('idle');
      setSenderError(null);
    }
  };

  // Generate 6-Digit Transfer Code
  const handleGenerateCode = async () => {
    if (!selectedFile) {
      setSenderError('Please select or attach a file first.');
      return;
    }

    try {
      setIsGenerating(true);
      setSenderError(null);
      const code = generate6DigitCode();
      const result = await P2PTransferService.registerOutgoingTransfer(selectedFile, senderName, code);
      setGeneratedCode(result.code);
      setTransferStatus('waiting');
    } catch (err: any) {
      setSenderError(err.message || 'Failed to generate transfer code. Please try again.');
      setTransferStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy 6-Digit Code
  const handleCopyCode = async () => {
    if (!generatedCode) return;
    const ok = await copyToClipboard(generatedCode);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Share message with code via Web Share or Clipboard
  const getShareText = () => {
    return `🔒 Direct P2P File Transfer from ConsentKey\nFile: ${selectedFile?.name || 'File'}\n6-Digit Security Code: ${generatedCode}\nOpen https://consentkey.online and click "I am Receiving", then enter code: ${generatedCode}\n(Device-to-device, zero upload, no server storage).`;
  };

  const handleShareCode = async () => {
    const text = getShareText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Direct P2P File Transfer Code',
          text,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Share directly via WhatsApp
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Receiver: Submit 6-digit Code to Receive File
  const handleReceiveFile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setReceiveError('Please enter the 6-digit transfer code provided by the sender.');
      return;
    }

    try {
      setIsReceiving(true);
      setReceiveError(null);
      setReceivedFile(null);
      setDownloadTriggered(false);

      const payload = await P2PTransferService.requestAndReceiveFile(cleanCode);
      setReceivedFile(payload);
    } catch (err: any) {
      setReceiveError(err.message || 'Could not receive file. Please check the code and ensure the sender is still active.');
    } finally {
      setIsReceiving(false);
    }
  };

  // Download received file to user's device
  const handleDownloadFile = () => {
    if (!receivedFile || !receivedFile.dataUrl) return;

    const link = document.createElement('a');
    link.href = receivedFile.dataUrl;
    link.download = receivedFile.fileName || 'downloaded_file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadTriggered(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-emerald-950/20'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/80'
        }`}
      >
        {/* Modal Top Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Direct P2P File Transfer</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  No Upload Required
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Free • Device-to-device instant handoff • Zero server storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: "I am sending" vs "I am Receiving" */}
        <div className="p-4 sm:px-6 pb-2">
          <div className={`p-1 rounded-2xl flex items-center border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200/80'
          }`}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('send');
                setSenderError(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'send'
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-700 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>I am sending</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('receive');
                setReceiveError(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'receive'
                  ? isDark
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-white text-cyan-800 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>I am Receiving</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 pt-2 overflow-y-auto space-y-4 flex-1">
          {/* =========================================================================
              TAB 1: I AM SENDING
              ========================================================================= */}
          {activeTab === 'send' && (
            <div className="space-y-4 animate-fadeIn">
              {/* File Dropzone & Attachment Selector */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  selectedFile
                    ? isDark
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-emerald-400 bg-emerald-50/50'
                    : isDark
                    ? 'border-slate-700 hover:border-emerald-500/50 bg-slate-950/40 hover:bg-slate-950/60'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 max-w-sm truncate">
                        {selectedFile.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatBytes(selectedFile.size)} • {selectedFile.type || 'Any file type'}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> File ready to transfer (Click to change)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Click to attach or drag and drop any file
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Photos, videos, audio, PDF, documents, archives (No size limit, directly device-to-device)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {senderError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{senderError}</span>
                </div>
              )}

              {/* Action Button: Generate Transfer Code */}
              {!generatedCode ? (
                <button
                  type="button"
                  disabled={!selectedFile || isGenerating}
                  onClick={handleGenerateCode}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98 ${
                    !selectedFile
                      ? 'opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Direct Transfer Code...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Transfer Code</span>
                    </>
                  )}
                </button>
              ) : (
                /* Generated 6-Digit Code Display & Sharing Box */
                <div className={`p-5 rounded-3xl border space-y-4 animate-fadeIn ${
                  isDark
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                    : 'bg-gradient-to-b from-emerald-50/90 to-white border-emerald-200 text-slate-800'
                }`}>
                  <div className="text-center space-y-1">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Your 6-Digit Security Code
                    </span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <div className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-950 border-2 border-emerald-500 text-3xl sm:text-4xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 font-mono shadow-inner select-all">
                        {generatedCode}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                          copiedCode
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                        title="Copy Code"
                      >
                        {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                    Share this 6-digit code with your recipient via phone call, SMS, WhatsApp, imo, Messenger, or social media. They just open this website, click <b>"I am Receiving"</b>, and enter this code.
                  </p>

                  {/* Share buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleShareCode}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        copiedLink
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isDark
                          ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4 text-emerald-500" />}
                      <span>{copiedLink ? 'Copied Instructions!' : 'Share Code (SMS/imo)'}</span>
                    </button>

                    <button
                      onClick={handleWhatsAppShare}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-emerald-600/20"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                      <span>Send on WhatsApp</span>
                    </button>
                  </div>

                  {/* Waiting live indicator */}
                  <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-medium border ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>Waiting for recipient to connect...</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Keep tab open</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: I AM RECEIVING
              ========================================================================= */}
          {activeTab === 'receive' && (
            <div className="space-y-4 animate-fadeIn">
              {!receivedFile ? (
                <form onSubmit={handleReceiveFile} className="space-y-4">
                  <div className={`p-5 rounded-3xl border space-y-3 ${
                    isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                  }`}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Enter the 6-Digit Transfer Code
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.replace(/\s+/g, ''))}
                        placeholder="e.g. 584920"
                        className={`w-full py-3.5 px-4 text-center font-mono text-2xl sm:text-3xl font-black tracking-widest rounded-2xl border outline-none transition uppercase ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 focus:border-cyan-500 text-cyan-300 placeholder:text-slate-600'
                            : 'bg-white border-slate-300 focus:border-cyan-600 text-cyan-900 placeholder:text-slate-300'
                        }`}
                        autoFocus
                      />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                      Ask the sender for their 6-digit code. Direct peer-to-peer handoff will begin immediately.
                    </p>
                  </div>

                  {receiveError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">Transfer Notice</span>
                        <p className="text-[11px] leading-relaxed opacity-90">{receiveError}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isReceiving || inputCode.length < 4}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98 ${
                      inputCode.length < 4 || isReceiving
                        ? 'opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                    }`}
                  >
                    {isReceiving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting & Receiving File...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Receive File Instantly</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* File Received Success Screen */
                <div className={`p-6 rounded-3xl border space-y-4 animate-fadeIn ${
                  isDark
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-emerald-50/80 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        File Received Successfully!
                      </span>
                      <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate max-w-sm">
                        {receivedFile.fileName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatBytes(receivedFile.fileSize)} • Code: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{receivedFile.code}</span>
                      </p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    🛡️ <b>Privacy Guarantee</b>: Nothing is stored or backed up on any server. You can open and download this file directly to your device now.
                  </div>

                  {/* Open & Download Button */}
                  <button
                    onClick={handleDownloadFile}
                    className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-98"
                  >
                    <HardDriveDownload className="w-5 h-5" />
                    <span>Download File to Device</span>
                  </button>

                  {downloadTriggered && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center font-semibold">
                      ✓ Download started! Check your device downloads folder.
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setReceivedFile(null);
                      setInputCode('');
                      setDownloadTriggered(false);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    Receive another file
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Direct P2P Transfer Architecture Features Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed transition ${
            isDark
              ? 'bg-slate-950/40 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">How Direct P2P Transfer Works:</span>
              <p>
                Files travel directly from device to device across browser peers. There is <b>no upload to any cloud</b>, no database backup, and no account required. Once closed, the in-memory ephemeral code dissolves automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className={`p-4 sm:px-6 border-t flex items-center justify-between text-xs text-slate-400 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted Device-to-Device</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
