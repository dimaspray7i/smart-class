import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Users, Search, ArrowLeft, Circle } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/ui/Toast';

const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

function ConversationItem({ conv, isActive, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full p-3 flex items-center gap-3 text-left transition-colors border-b-2 border-dashed border-base-black hover:bg-retro-yellow/10 ${isActive ? 'bg-retro-orange/10 border-l-4 border-l-retro-orange' : ''}`}>
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full border-2 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-retro-blue">
          {conv.name?.[0]?.toUpperCase()}
        </div>
        {conv.online && <Circle className="w-2.5 h-2.5 absolute bottom-0 right-0 text-success fill-success" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-retro-display font-black text-sm truncate">{conv.name}</p>
          <span className="font-retro-mono text-[9px] text-base-black/40 flex-shrink-0 ml-1">
            {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className="font-retro-mono text-[10px] text-base-black/50 truncate">{conv.last_message || 'Belum ada pesan'}</p>
        {conv.unread_count > 0 && (
          <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-danger text-base-white text-[9px] font-black">{conv.unread_count}</span>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-retro border-2 border-base-black ${isOwn ? 'bg-retro-blue text-base-white shadow-[2px_2px_0px_0px_#111]' : 'bg-base-white shadow-[2px_2px_0px_0px_#111]'}`}>
        <p className="font-retro-mono text-sm">{msg.content}</p>
        <p className={`font-retro-mono text-[9px] mt-1 ${isOwn ? 'text-base-white/60' : 'text-base-black/40'}`}>
          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function TeacherMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const { data: conversations } = useQuery({
    queryKey: ['teacher-conversations'],
    queryFn: () => api.get('/teacher/messages/conversations'),
    refetchInterval: 10000,
  });
  const { data: messages } = useQuery({
    queryKey: ['teacher-messages', activeConv?.id],
    queryFn: () => api.get(`/teacher/messages/${activeConv.id}`),
    enabled: !!activeConv,
    refetchInterval: 5000,
  });

  const sendMsg = useMutation({
    mutationFn: (data) => api.post('/teacher/messages', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-messages'] }); setText(''); },
    onError: () => showToast('❌ Gagal mengirim pesan', 'error'),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const convList = (conversations?.data || []).filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
  const msgList = messages?.data || [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;
    sendMsg.mutate({ receiver_id: activeConv.id, content: text.trim() });
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 right-6 z-50"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></motion.div>}
      </AnimatePresence>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black p-6">
        <h1 className="retro-heading retro-heading-xl text-retro-blue flex items-center gap-3"><MessageSquare className="w-8 h-8" /> Pesan</h1>
        <p className="font-retro-mono text-sm text-base-black/70 mt-1">Komunikasi langsung dengan siswa dan orang tua</p>
      </motion.div>

      <motion.div variants={cardVariants} className="retro-card bg-base-white border-4 border-base-black overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className={`w-full lg:w-72 border-r-4 border-base-black flex flex-col flex-shrink-0 ${activeConv ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-3 border-b-2 border-base-black">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-black/40" />
                <input type="text" placeholder="Cari kontak..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 py-2 pr-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-gray/20 focus:outline-none focus:border-retro-orange" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convList.length > 0 ? convList.map(c => (
                <ConversationItem key={c.id} conv={c} isActive={activeConv?.id === c.id} onClick={() => setActiveConv(c)} />
              )) : (
                <div className="p-6 text-center">
                  <Users className="w-10 h-10 text-base-black/20 mx-auto mb-2" />
                  <p className="font-retro-mono text-xs text-base-black/50">Tidak ada kontak</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden lg:flex' : 'flex'}`}>
            {activeConv ? (
              <>
                <div className="p-4 border-b-4 border-base-black bg-retro-blue/10 flex items-center gap-3">
                  <button onClick={() => setActiveConv(null)} className="lg:hidden p-1 border-2 border-base-black rounded-retro hover:bg-base-gray/20">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full border-2 border-base-black bg-retro-blue/20 flex items-center justify-center font-retro-display font-black text-retro-blue">
                    {activeConv.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-retro-display font-black text-base-black">{activeConv.name}</p>
                    <p className="font-retro-mono text-[10px] text-base-black/50">{activeConv.role || 'Siswa'}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {msgList.map(msg => <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user?.id} />)}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={handleSend} className="p-3 border-t-4 border-base-black flex gap-2">
                  <input type="text" placeholder="Tulis pesan..." value={text} onChange={e => setText(e.target.value)}
                    className="flex-1 py-2 px-3 border-2 border-base-black rounded-retro font-retro-mono text-sm bg-base-white focus:outline-none focus:border-retro-orange" />
                  <button type="submit" disabled={!text.trim() || sendMsg.isLoading}
                    className="p-2.5 bg-retro-blue text-base-white border-2 border-base-black rounded-retro hover:bg-retro-blue/90 disabled:opacity-50 shadow-[2px_2px_0px_0px_#111]">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-base-black/20 mx-auto mb-3" />
                  <p className="font-retro-mono text-base-black/50">Pilih percakapan untuk mulai berkirim pesan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
