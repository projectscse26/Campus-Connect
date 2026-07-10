import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Search, Send, Image as ImageIcon, Shield, User, X, Check, RefreshCw,
  MessageCircle, Info, Mail, Phone, Calendar, Users, ArrowLeft, Camera, Smile
} from 'lucide-react';

export default function DeanMessaging() {
  /* ─────────────────────── Preserved state ─────────────────────── */
  const [conversations, setConversations]     = useState([]);
  const [selectedConv,  setSelectedConv]      = useState(null);
  const [messages,      setMessages]          = useState([]);
  const [searchQuery,   setSearchQuery]       = useState('');
  const [inputText,     setInputText]         = useState('');
  const [selectedFile,  setSelectedFile]      = useState(null);
  const [previewUrl,    setPreviewUrl]        = useState(null);
  const [loadingList,   setLoadingList]       = useState(true);
  const [loadingChat,   setLoadingChat]       = useState(false);
  const [sending,       setSending]           = useState(false);
  const [revealProfile, setRevealProfile]     = useState(null);
  const [showDrawer,    setShowDrawer]        = useState(false);
  const [loadingReveal, setLoadingReveal]     = useState(false);

  /* ─────────────────────── New UI state ────────────────────────── */
  const [isDragging,      setIsDragging]      = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream,    setCameraStream]    = useState(null);

  const messagesEndRef = useRef(null);
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const fileInputRef   = useRef(null);

  /* ─────────────────────── Preserved effects ───────────────────── */
  useEffect(() => { fetchConversations(); }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false);
      if (selectedConv) fetchMessages(selectedConv.id, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConv]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  /* ─────────────────────── Preserved API functions ─────────────── */
  const fetchConversations = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingList(true);
      const url = searchQuery
        ? `/api/messaging/conversations?search=${encodeURIComponent(searchQuery)}`
        : '/api/messaging/conversations';
      const res = await axios.get(url);
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      if (showLoading) setLoadingList(false);
    }
  };

  const fetchMessages = async (convId, showLoading = true) => {
    try {
      if (showLoading) setLoadingChat(true);
      const res = await axios.get(`/api/messaging/conversations/${convId}/messages`);
      setMessages(res.data);
      if (showLoading) window.dispatchEvent(new CustomEvent('refetch-badges'));
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      if (showLoading) setLoadingChat(false);
    }
  };

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    setShowDrawer(false);
    setRevealProfile(null);
    fetchMessages(conv.id, true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    if (!selectedConv) return;
    setSending(true);
    const formData = new FormData();
    if (inputText.trim())  formData.append('message_text', inputText);
    if (selectedFile)      formData.append('file', selectedFile);
    try {
      const res = await axios.post(
        `/api/messaging/conversations/${selectedConv.id}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setMessages(prev => [...prev, res.data]);
      setInputText('');
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchConversations(false);
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleRevealProfile = async () => {
    if (!selectedConv) return;
    try {
      setLoadingReveal(true);
      setShowDrawer(true);
      const res = await axios.get(`/api/messaging/conversations/${selectedConv.id}/student-profile`);
      setRevealProfile(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to reveal student profile');
      setShowDrawer(false);
    } finally {
      setLoadingReveal(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /* ─────────────────────── New helpers ─────────────────────────── */
  const formatConvTime = (timeStr) => {
    if (!timeStr) return '';
    const d   = new Date(timeStr);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  /* Drag-and-drop */
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

  /* Camera */
  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert('Could not access camera. Please check permissions.');
      setShowCameraModal(false);
    }
  };
  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCameraModal(false);
  };
  const capturePhoto = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], 'photo.png', { type: 'image/png' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }, 'image/png');
  };

  /* ──────────────────────────── RENDER ─────────────────────────── */
  return (
    <div
      className="flex h-[calc(100vh-140px)] bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden relative w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && selectedConv && (
        <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center gap-3 pointer-events-none border-2 border-dashed border-[#0095F6] rounded-2xl transition-all">
          <ImageIcon className="w-10 h-10 text-[#0095F6]" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-[#262626]">Drop to send image</p>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* LEFT PANEL — Conversation List            */}
      {/* ══════════════════════════════════════════ */}
      <section
        className={`w-full md:w-[320px] lg:w-[360px] border-r border-[#DBDBDB] flex flex-col shrink-0 bg-white ${selectedConv ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#DBDBDB]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#262626]">Messages</h2>
            <button className="p-1.5 hover:bg-[#F7F7F7] rounded-full transition-colors duration-150">
              <MessageCircle className="w-[22px] h-[22px] text-[#262626]" strokeWidth={2} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8E]" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-[#EFEFEF] rounded-lg pl-9 pr-4 py-[9px] text-[13px] text-[#262626] placeholder-[#8E8E8E] focus:outline-none focus:bg-[#E8E8E8] transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <RefreshCw className="w-5 h-5 text-[#8E8E8E] animate-spin" />
              <p className="text-xs text-[#8E8E8E]">Loading...</p>
            </div>
          ) : conversations.length > 0 ? (
            conversations.map(conv => {
              const isSelected = selectedConv?.id === conv.id;
              const hasUnread  = conv.dean_unread_count > 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left transition-colors duration-150 ${isSelected ? 'bg-[#F7F7F7]' : 'hover:bg-[#FAFAFA]'}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[#F0F0F0] to-[#DBDBDB] flex items-center justify-center">
                      <Shield className="w-6 h-6 text-[#ABABAB]" />
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#44BF7F] border-2 border-white rounded-full" />
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[14px] truncate leading-tight ${hasUnread ? 'font-bold text-[#262626]' : 'font-normal text-[#262626]'}`}>
                        {conv.student_name || 'Anonymous Student'}
                      </span>
                      <span className={`text-[11px] ml-2 shrink-0 ${hasUnread ? 'text-[#0095F6] font-semibold' : 'text-[#8E8E8E]'}`}>
                        {formatConvTime(conv.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[13px] truncate ${hasUnread ? 'font-semibold text-[#262626]' : 'text-[#8E8E8E] font-normal'}`}>
                        {conv.last_message || 'No messages yet'}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-[#0095F6] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.dean_unread_count > 9 ? '9+' : conv.dean_unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-52 gap-3 px-8 text-center">
              <MessageCircle className="w-12 h-12 text-[#DBDBDB]" strokeWidth={1.5} />
              <p className="text-[13px] font-semibold text-[#262626]">No messages yet</p>
              <p className="text-xs text-[#8E8E8E] leading-relaxed">Students will appear here once they send a message.</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* CENTER PANEL — Active Chat                */}
      {/* ══════════════════════════════════════════ */}
      <section className={`flex-1 flex flex-col bg-white overflow-hidden ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <header className="flex items-center justify-between px-5 py-3 border-b border-[#DBDBDB] bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConv(null)}
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
                  <p className="text-[14px] font-semibold text-[#262626] leading-tight">{selectedConv.student_name || 'Anonymous Student'}</p>
                  <p className="text-[11px] text-[#8E8E8E]">Active now</p>
                </div>
              </div>
              {/* Info icon — toggles right panel */}
              <button
                onClick={() => {
                  if (showDrawer) { setShowDrawer(false); setRevealProfile(null); }
                  else handleRevealProfile();
                }}
                className={`p-2 rounded-full transition-colors duration-150 ${showDrawer ? 'bg-[#EFEFEF]' : 'hover:bg-[#F7F7F7]'}`}
                title="Student details"
              >
                <Info className="w-[22px] h-[22px] text-[#262626]" strokeWidth={2} />
              </button>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto px-6 py-5 bg-white space-y-0.5">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 text-[#8E8E8E] animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#F7F7F7] flex items-center justify-center">
                    <Shield className="w-8 h-8 text-[#DBDBDB]" />
                  </div>
                  <p className="text-[13px] text-[#8E8E8E]">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isMe    = msg.sender_type === 'dean';
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

            {/* Image preview strip */}
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
                <p className="text-xs text-[#8E8E8E]">Image ready to send</p>
              </div>
            )}

            {/* Composer */}
            <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-[#DBDBDB] bg-white shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={'Message...'}
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
          </>
        ) : (
          /* Empty-state splash */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <div className="w-[76px] h-[76px] rounded-full border-[2px] border-[#262626] flex items-center justify-center">
              <MessageCircle className="w-9 h-9 text-[#262626]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[18px] font-light text-[#262626] mb-1">Your messages</p>
              <p className="text-[13px] text-[#8E8E8E] max-w-[240px] leading-relaxed mx-auto">
                Select a conversation to read and reply to student messages.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* RIGHT PANEL — Student Profile Drawer      */}
      {/* ══════════════════════════════════════════ */}
      <aside
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[360px] bg-white border-l border-[#DBDBDB] flex flex-col z-30 transition-transform duration-[220ms] ease-out ${showDrawer ? 'translate-x-0 shadow-[-4px_0_24px_rgba(0,0,0,0.08)]' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DBDBDB] shrink-0">
          <h3 className="text-[14px] font-bold text-[#262626]">Details</h3>
          <button
            onClick={() => { setShowDrawer(false); setRevealProfile(null); }}
            className="p-2 hover:bg-[#F7F7F7] rounded-full text-[#262626] transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingReveal ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="w-5 h-5 text-[#8E8E8E] animate-spin" />
            </div>
          ) : revealProfile ? (
            <div className="px-6 py-6 space-y-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-[80px] h-[80px] rounded-full bg-[#F0F0F0] flex items-center justify-center overflow-hidden border border-[#DBDBDB]">
                  {revealProfile.photo_url
                    ? <img src={revealProfile.photo_url} alt="Student" className="w-full h-full object-cover" />
                    : <User className="w-9 h-9 text-[#8E8E8E]" strokeWidth={1.5} />
                  }
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#262626]">{revealProfile.name}</p>
                  <p className="text-[12px] text-[#8E8E8E] mt-0.5">{revealProfile.register_number}</p>
                </div>
              </div>

              <div className="border-t border-[#DBDBDB]" />

              {/* Info fields */}
              <div className="space-y-4">
                {[
                  { icon: Users,    label: 'Department',         value: revealProfile.department },
                  { icon: Calendar, label: 'Year & Semester',    value: `Year ${revealProfile.current_year} · Semester ${revealProfile.current_semester}` },
                  { icon: Users,    label: 'Section',            value: revealProfile.section },
                  { icon: Mail,     label: 'Email',              value: revealProfile.email },
                  { icon: Phone,    label: 'Phone',              value: revealProfile.phone },
                ].filter(item => item.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-[#8E8E8E] mt-0.5 shrink-0" strokeWidth={1.75} />
                    <div>
                      <p className="text-[10px] text-[#8E8E8E] uppercase tracking-wide font-medium mb-0.5">{label}</p>
                      <p className="text-[13px] text-[#262626] font-medium break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#DBDBDB] pt-4">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-[#8E8E8E] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <p className="text-[12px] text-[#8E8E8E] leading-relaxed">
                    This information is retrieved confidentially. The student is not notified that their profile was viewed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <User className="w-8 h-8 text-[#DBDBDB]" strokeWidth={1.5} />
              <p className="text-[13px] text-[#8E8E8E]">No profile data</p>
            </div>
          )}
        </div>
      </aside>

      {/* Camera Modal */}
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
