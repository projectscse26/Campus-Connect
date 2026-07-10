import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Send, Image as ImageIcon, Camera, Shield, AlertTriangle, X, Check, ArrowLeft, RefreshCw, Info, Smile, Search, MessageCircle
} from 'lucide-react';

export default function StudentMessaging() {
  const navigate = useNavigate();

  /* ─────────────────────── Preserved state ─────────────────────── */
  const [acknowledged, setAcknowledged]       = useState(false);
  const [conversation, setConversation]       = useState(null);
  const [messages, setMessages]               = useState([]);
  const [inputText, setInputText]             = useState('');
  const [selectedFile, setSelectedFile]       = useState(null);
  const [previewUrl, setPreviewUrl]           = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [sending, setSending]                 = useState(false);
  const [error, setError]                     = useState(null);

  // Camera capture states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream]       = useState(null);

  /* ─────────────────────── New UI state ────────────────────────── */
  const [showDrawer, setShowDrawer]           = useState(false);
  const [isDragging, setIsDragging]           = useState(false);

  const messagesEndRef = useRef(null);
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const fileInputRef   = useRef(null);

  // 1. Fetch conversation on load
  useEffect(() => {
    if (acknowledged) {
      fetchConversation();
    }
  }, [acknowledged]);

  // 2. Poll for new messages every 5 seconds
  useEffect(() => {
    let interval;
    if (acknowledged && conversation) {
      interval = setInterval(() => {
        fetchMessages(conversation.id, false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [acknowledged, conversation]);

  // 3. Scroll to bottom when messages list changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/messaging/student/conversation');
      setConversation(res.data);
      await fetchMessages(res.data.id, true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load conversation with HOD');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId, isFirstLoad = false) => {
    try {
      const res = await axios.get(`/api/messaging/conversations/${convId}/messages`);
      setMessages(res.data);
      if (isFirstLoad) {
        window.dispatchEvent(new CustomEvent('refetch-badges'));
      }
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAcceptNotice = () => {
    setAcknowledged(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (jpg, jpeg, png, webp)');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied', err);
      alert('Could not access camera. Please check permissions or use image upload.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "instant_photo.png", { type: "image/png" });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        stopCamera();
      }, 'image/png');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    setSending(true);
    const formData = new FormData();
    if (inputText.trim()) {
      formData.append('message_text', inputText);
    }
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const res = await axios.post(
        `/api/messaging/conversations/${conversation.id}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setMessages(prev => [...prev, res.data]);
      setInputText('');
      setSelectedFile(null);
      setPreviewUrl(null);
      window.dispatchEvent(new CustomEvent('refetch-badges'));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConvTime = (timeStr) => {
    if (!timeStr) return '';
    const d   = new Date(timeStr);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  /* Drag and drop */
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave = ()  => setIsDragging(false);
  const handleDrop      = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  /* Privacy Notice screen */
  if (!acknowledged) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-[480px] w-full bg-white rounded-3xl border border-[#DBDBDB] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-8 transition-all">
          <div className="flex flex-col items-center text-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#FAFAFA] border border-[#DBDBDB] flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#262626]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#262626]">Anonymous Messaging</h2>
              <p className="text-[12px] text-[#8E8E8E] font-medium tracking-wide uppercase mt-1">Secure Channel to Dean</p>
            </div>
          </div>

          <div className="space-y-4 text-[#8E8E8E] leading-relaxed text-[13.5px]">
            <p>
              Your identity is hidden during normal conversations with the Dean. Your name, register number, and contact details will not be shown in the chat window.
            </p>
            
            <div className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-2xl p-4 flex gap-3 text-[#262626] text-[12px] font-medium">
              <AlertTriangle className="w-5 h-5 text-[#262626] shrink-0" strokeWidth={1.75} />
              <div>
                <p className="font-bold mb-1">Important Notice</p>
                To maintain safety and compliance, messages are mapped to your student profile internally. Misuse of the platform may result in academic disciplinary action.
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/student')}
              className="w-full py-3 rounded-xl border border-[#DBDBDB] text-[#262626] text-[13px] font-semibold hover:bg-[#F7F7F7] transition-all"
            >
              Go Back
            </button>
            <button
              onClick={handleAcceptNotice}
              className="w-full py-3 rounded-xl bg-[#262626] text-white text-[13px] font-semibold hover:bg-black transition-all shadow-md"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#8E8E8E] animate-spin" />
        <p className="text-[13px] text-[#8E8E8E] font-medium">Connecting to secure messaging channel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-[#FAFAFA] rounded-full border border-[#DBDBDB] flex items-center justify-center text-[#262626] mb-4">
          <AlertTriangle className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <h3 className="text-[16px] font-bold text-[#262626]">Unable to connect to the Dean's Messages.</h3>
        <p className="text-[12px] text-[#8E8E8E] mt-2 max-w-sm">Please ensure the Dean account is active, or contact the system administrator.</p>
        <button
          onClick={() => navigate('/student')}
          className="mt-6 px-6 py-2.5 bg-[#262626] text-white font-semibold text-[13px] rounded-xl hover:bg-black transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100vh-140px)] bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden relative w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center gap-3 pointer-events-none border-2 border-dashed border-[#0095F6] rounded-2xl transition-all">
          <ImageIcon className="w-10 h-10 text-[#0095F6]" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-[#262626]">Drop to send image</p>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* CENTER PANEL — Message Thread viewport    */}
      {/* ══════════════════════════════════════════ */}
      <section className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-[#DBDBDB] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student')}
              className="p-2 hover:bg-[#F7F7F7] rounded-full text-[#262626] md:hidden transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#F0F0F0] to-[#DBDBDB] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#ABABAB]" />
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#44BF7F] border-2 border-white rounded-full" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#262626] leading-tight">
                {conversation?.dean_name || 'Dean'}
              </p>
              <p className="text-[11px] text-[#8E8E8E] font-medium">Dean of Students (Secure Connection)</p>
            </div>
          </div>

          {/* Info toggle */}
          <button
            onClick={() => setShowDrawer(prev => !prev)}
            className={`p-2 rounded-full transition-colors duration-150 ${showDrawer ? 'bg-[#EFEFEF]' : 'hover:bg-[#F7F7F7]'}`}
            title="Conversation details"
          >
            <Info className="w-[22px] h-[22px] text-[#262626]" strokeWidth={2} />
          </button>
        </header>

        {/* Message Log */}
        <main className="flex-1 overflow-y-auto px-6 py-5 bg-white space-y-0.5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-16 h-16 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#DBDBDB]" />
              </div>
              <p className="text-[13px] text-[#8E8E8E]">No messages yet. Send a secure report or query.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isMe    = msg.sender_type === 'student';
                const prevMsg = messages[idx - 1];
                const showTimestamp = !prevMsg ||
                  new Date(msg.created_at) - new Date(prevMsg.created_at) > 5 * 60 * 1000;
                return (
                  <div key={msg.id}>
                    {showTimestamp && (
                      <div className="text-center my-4">
                        <span className="text-[11px] text-[#8E8E8E] font-medium">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex items-end gap-2 mb-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-[#EFEFEF] flex items-center justify-center shrink-0 mb-0.5">
                          <Shield className="w-3.5 h-3.5 text-[#ABABAB]" />
                        </div>
                      )}
                      <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {msg.message_type === 'image' && msg.image_url && (
                          <div
                            className={`rounded-2xl overflow-hidden cursor-pointer mb-0.5 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                            onClick={() => window.open(`${axios.defaults.baseURL}${msg.image_url}`, '_blank')}
                          >
                            <img
                              src={`${axios.defaults.baseURL}${msg.image_url}`}
                              alt="Attachment"
                              className="max-h-[260px] w-auto object-cover hover:opacity-90 transition-opacity"
                            />
                          </div>
                        )}
                        {msg.message_text && (
                          <div className={`px-4 py-2.5 text-[14px] leading-relaxed rounded-[22px] ${isMe ? 'bg-[#262626] text-white rounded-br-sm' : 'bg-[#EFEFEF] text-[#262626] rounded-bl-sm'}`}>
                            <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                          </div>
                        )}
                        {isMe && (
                          <div className="flex items-center gap-0.5 mt-0.5 pr-1">
                            <Check className={`w-3 h-3 ${msg.is_read ? 'text-[#0095F6]' : 'text-[#ABABAB]'}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </main>

        {/* Upload previews */}
        {previewUrl && (
          <div className="flex items-center gap-3 px-5 py-3 border-t border-[#DBDBDB] bg-white shrink-0">
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-[#DBDBDB]" />
              <button
                type="button"
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#262626] text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
            <p className="text-xs text-[#8E8E8E]">Image selected for anonymous transmission</p>
          </div>
        )}

        {/* Input Composer */}
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-[#DBDBDB] bg-white shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={'Message anonymously...'}
            className="flex-1 bg-[#EFEFEF] rounded-[22px] px-4 py-2.5 text-[13px] text-[#262626] placeholder-[#8E8E8E] focus:outline-none focus:bg-[#E8E8E8] transition-colors min-w-0"
            disabled={sending}
          />
          {inputText.trim() ? (
            <button type="submit" disabled={sending} className="text-[#0095F6] font-semibold text-[13px] hover:text-[#0077CC] transition-colors shrink-0 px-2">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send'}
            </button>
          ) : (
            <button type="button" className="p-2 text-[#262626] hover:bg-[#F7F7F7] rounded-full transition-colors shrink-0">
              <Send className="w-[20px] h-[20px]" strokeWidth={1.75} />
            </button>
          )}
        </form>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* RIGHT PANEL — Anonymity info drawer       */}
      {/* ══════════════════════════════════════════ */}
      <aside
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[360px] bg-white border-l border-[#DBDBDB] flex flex-col z-30 transition-transform duration-[220ms] ease-out ${showDrawer ? 'translate-x-0 shadow-[-4px_0_24px_rgba(0,0,0,0.08)]' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DBDBDB] shrink-0">
          <h3 className="text-[14px] font-bold text-[#262626]">Details</h3>
          <button
            onClick={() => setShowDrawer(false)}
            className="p-2 hover:bg-[#F7F7F7] rounded-full text-[#262626] transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-[88px] h-[88px] rounded-full bg-[#FAFAFA] border border-[#DBDBDB] flex items-center justify-center shadow-sm">
            <Shield className="w-10 h-10 text-[#262626]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#262626]">Anonymous Student</p>
            <p className="text-[12px] text-[#8E8E8E] mt-1.5 max-w-[200px] leading-relaxed mx-auto">
              Your identity remains hidden during conversations.
            </p>
          </div>
        </div>
      </aside>

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DBDBDB]">
              <p className="text-[14px] font-semibold text-[#262626]">Take Photo</p>
              <button onClick={stopCamera} className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors">
                <X className="w-4 h-4 text-[#262626]" />
              </button>
            </div>
            <div className="bg-black aspect-video">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="py-5 flex justify-center bg-[#F7F7F7]">
              <button
                onClick={capturePhoto}
                className="w-14 h-14 rounded-full bg-white border-4 border-[#262626] shadow-lg hover:scale-105 active:scale-95 transition-transform"
                title="Capture"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
