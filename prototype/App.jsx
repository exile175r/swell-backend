import React, { useState, useEffect, useRef } from 'react';
import { Mic, Moon, Sun, Bell, Heart, ThumbsDown, MessageCircle, User, PenLine, X, BarChart2, MoreHorizontal, Loader2, StopCircle } from 'lucide-react';
import { io } from 'socket.io-client';

/**
 * 🌊 너울 (Swell) Frontend Client
 * - Features: Faster-Whisper 실시간 STT (Socket.io), CRUD, Vote, Reaction
 * - Backend: http://localhost:8080
 */

const API_BASE_URL = "http://localhost:8080/api";
const SOCKET_URL = "http://localhost:8080";

// --- [API Service Layer] ---
const api = {
  // 1. 게시글 목록 조회
  getPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error('Network error');
    return response.json();
  },

  // 2. 게시글 작성
  createPost: async (postData) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    return response.json();
  },

  // 3. 반응(공감) 남기기
  reactToPost: async (postId, type) => {
    await fetch(`${API_BASE_URL}/posts/${postId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
  },

  // 4. 투표하기
  votePost: async (postId, voteType) => {
    await fetch(`${API_BASE_URL}/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType })
    });
  }
};

// --- 컴포넌트 시작 ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [myProfile, setMyProfile] = useState({
    nickname: "너울테스터",
    bio: "Faster-Whisper 실시간 연동 중",
    postCount: 0,
    likeCount: 0,
  });

  const socketRef = useRef(null);

  useEffect(() => {
    // Socket.io 초기화
    socketRef.current = io(SOCKET_URL);

    fetchData();
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isDarkMode]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId, type) => {
    // Optimistic UI Update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          myReaction: type,
          likes: type === 'like' ? post.likes + 1 : post.likes,
          dislikes: type === 'dislike' ? post.dislikes + 1 : post.dislikes
        };
      }
      return post;
    }));
    await api.reactToPost(postId, type);
  };

  const handleVote = async (postId, voteType) => {
    await api.votePost(postId, voteType);
    fetchData(); // 투표 후 최신 데이터 갱신
  };

  const handleAddPost = async (postData) => {
    try {
      await api.createPost({
        ...postData,
        userId: '00000000-0000-0000-0000-000000000000' // Prototype Default
      });
      setShowWriteModal(false);
      fetchData();
    } catch (e) {
      alert("업로드 실패: 서버 로그를 확인해주세요.");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>

      {/* Header */}
      <header className={`sticky top-0 z-10 px-4 py-3 flex justify-between items-center backdrop-blur-md border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'}`}>
        <h1 className="text-xl font-bold tracking-tight text-indigo-500 flex items-center gap-2">
          너울 (Swell) <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">Proto</span>
        </h1>
        <div className="flex gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1 rounded-full hover:bg-slate-800/50 transition">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="relative p-1 rounded-full hover:bg-slate-800/50 transition">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 max-w-md mx-auto min-h-[80vh]">
        {activeTab === 'home' && (
          <div className="space-y-4 p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center pt-20 text-slate-500">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>로딩 중...</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isDarkMode={isDarkMode}
                  onLike={handleLike}
                  onVote={handleVote}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && <ProfilePage profile={myProfile} isDarkMode={isDarkMode} />}
      </main>

      {/* Modals */}
      {showWriteModal && (
        <WriteModal
          socket={socketRef.current}
          onClose={() => setShowWriteModal(false)}
          onSubmit={handleAddPost}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} pb-safe`}>
        <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'home' ? 'text-indigo-500' : 'text-slate-400'}`}>
            <MessageCircle size={24} />
          </button>
          <div className="relative -top-5">
            <button onClick={() => setShowWriteModal(true)} className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-500 transition-transform active:scale-95 group">
              <PenLine size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'profile' ? 'text-indigo-500' : 'text-slate-400'}`}>
            <User size={24} />
          </button>
        </div>
      </nav>

    </div>
  );
}

// --- Sub Components ---

function PostCard({ post, isDarkMode, onLike, onVote }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "방금 전";
    }
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
            {post.nickname ? post.nickname[0] : '?'}
          </div>
          <div>
            <p className="text-sm font-medium">{post.nickname}</p>
            <p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <button className="text-slate-500 hover:text-slate-300"><MoreHorizontal size={18} /></button>
      </div>
      <p className={`whitespace-pre-wrap leading-relaxed mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{post.content}</p>
      {post.hasVote && (
        <div className={`mb-4 p-3 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-400">
            <BarChart2 size={14} /><span>투표 현황</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onVote(post.id, 'agree')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${isDarkMode ? 'bg-slate-700 hover:bg-indigo-900/30' : 'bg-white border border-slate-200 hover:bg-indigo-50'}`}>찬성</button>
            <button onClick={() => onVote(post.id, 'disagree')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${isDarkMode ? 'bg-slate-700 hover:bg-red-900/30' : 'bg-white border border-slate-200 hover:bg-red-50'}`}>반대</button>
          </div>
        </div>
      )}
      <div className={`flex items-center justify-between pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
        <div className="flex gap-4">
          <button onClick={() => onLike(post.id, 'like')} className={`flex items-center gap-1.5 text-sm transition ${post.myReaction === 'like' ? 'text-pink-500' : 'text-slate-400 hover:text-pink-400'}`}>
            <Heart size={18} fill={post.myReaction === 'like' ? "currentColor" : "none"} /><span>{post.likes}</span>
          </button>
          <button onClick={() => onLike(post.id, 'dislike')} className={`flex items-center gap-1.5 text-sm transition ${post.myReaction === 'dislike' ? 'text-blue-500' : 'text-slate-400 hover:text-blue-400'}`}>
            <ThumbsDown size={18} fill={post.myReaction === 'dislike' ? "currentColor" : "none"} /><span>{post.dislikes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function WriteModal({ socket, onClose, onSubmit, isDarkMode }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasVote, setHasVote] = useState(false);

  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleResult = (data) => {
      if (data && data.text) {
        setText(prev => prev + " " + data.text.trim());
      }
    };

    socket.on('transcription-result', handleResult);
    return () => socket.off('transcription-result', handleResult);
  }, [socket]);

  // 🎤 Real-time Streaming Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0 && socket) {
          socket.emit('audio-chunk', e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      // 250ms 마다 청크 전송
      mediaRecorderRef.current.start(250);
      setIsRecording(true);
      if (socket) socket.emit('start-stt');
    } catch (e) {
      console.error("Mic Error:", e);
      alert("마이크 권한이 필요합니다.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (socket) socket.emit('stop-stt');
    }
  };

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full sm:max-w-md h-[90vh] sm:h-auto sm:rounded-2xl rounded-t-3xl p-6 flex flex-col ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">글쓰기</h2>
          <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
        </div>

        <textarea
          className={`flex-1 w-full p-4 rounded-xl resize-none outline-none text-lg mb-2 ${isDarkMode ? 'bg-slate-900 text-white placeholder-slate-600' : 'bg-slate-50 text-slate-800 placeholder-slate-400'}`}
          placeholder="오늘 하루는 어땠나요?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setHasVote(!hasVote)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${hasVote ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
            <BarChart2 size={16} /> 투표 기능 포함
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMicClick}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition 
              ${isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : (isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700')
              }`}
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
            {isRecording ? "녹음 종료" : "음성 입력"}
          </button>

          <button onClick={() => onSubmit({ content: text, hasVote })} disabled={!text.trim()} className="flex-1 py-4 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50 hover:bg-indigo-500 transition">
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ profile, isDarkMode }) {
  return (
    <div className="p-4 pt-8 text-center">
      <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>{profile.nickname ? profile.nickname[0] : 'U'}</div>
      <h2 className="text-xl font-bold mb-1">{profile.nickname}</h2>
      <p className="text-slate-500 text-sm mb-4">{profile.bio}</p>
      <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
        <p className="text-sm text-slate-400">백엔드 개발자 메모</p>
        <p className="mt-2 text-xs">프로필 수정 API는 아직 연결되지 않았습니다.</p>
      </div>
    </div>
  );
}