import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, ShoppingBag, Plus, ShoppingCart, User, Home, Search, Compass, DollarSign, BarChart3, HelpCircle, ListFilter, Sparkles } from 'lucide-react';
import { Stream, Product, Poll, Question } from './types';
import { MOCK_STREAMS, MOCK_USER } from './mockData';
import { cn } from './lib/utils';
import { getProductRecommendations } from './services/geminiService';
import { LiveChat } from './components/LiveChat';
import { useAuth, db, collection, query, onSnapshot, orderBy, setDoc, doc, serverTimestamp, getDocs, where } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'creator' | 'profile' | 'success'>('home');

  useEffect(() => {
    if (window.location.pathname === '/success') {
      setActiveTab('success');
    }
  }, []);
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <Feed 
                streams={MOCK_STREAMS} 
                activeStreamIndex={activeStreamIndex}
                onStreamChange={setActiveStreamIndex}
              />
            </motion.div>
          )}
          
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-zinc-950 p-6 overflow-y-auto"
            >
              <Discover />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="h-full w-full bg-zinc-950 p-6 overflow-y-auto"
            >
              <Profile user={MOCK_USER} />
            </motion.div>
          )}

          {activeTab === 'creator' && (
            <motion.div
              key="creator"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="h-full w-full bg-zinc-950 p-6"
            >
              <CreatorDashboard />
            </motion.div>
          )}

          {activeTab === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <SuccessPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="h-16 border-t border-zinc-800 bg-black flex items-center justify-around px-4 z-50">
        <NavButton icon={<Home size={24} />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={<Search size={24} />} label="Discover" active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} />
        <div className="relative -top-4">
          <button 
            onClick={() => setActiveTab('creator')}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
        <NavButton icon={<BarChart3 size={24} />} label="Creator" active={activeTab === 'creator'} onClick={() => setActiveTab('creator')} />
        <NavButton icon={<User size={24} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center space-y-1 transition-colors",
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
    </button>
  );
}

function Feed({ streams, activeStreamIndex, onStreamChange }: { streams: Stream[], activeStreamIndex: number, onStreamChange: (index: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveStreams, setLiveStreams] = useState<Stream[]>(streams);

  useEffect(() => {
    const q = query(collection(db, 'streams'), where('isActive', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Stream));
      if (data.length > 0) {
        setLiveStreams(data);
      }
    });
    return unsub;
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollPos / height);
    if (index !== activeStreamIndex) {
      onStreamChange(index);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
    >
      {liveStreams.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center flex-col p-6 text-center text-zinc-500">
           <Compass size={48} className="mb-4 opacity-50" />
           <p>No streams available.</p>
           <p className="text-sm">Head to Creator Studio to start one!</p>
        </div>
      ) : (
        liveStreams.map((stream, idx) => (
          <div key={stream.id} className="h-full w-full snap-start relative">
            <StreamPlayer stream={stream} isActive={idx === activeStreamIndex} />
          </div>
        ))
      )}
    </div>
  );
}

function StreamPlayer({ stream, isActive }: { stream: Stream, isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showShop, setShowShop] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (isActive && hasAccess) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isActive, hasAccess]);

  useEffect(() => {
     if (!stream.pricePerView || stream.pricePerView === 0) {
       setHasAccess(true);
       return;
     }
     
     if (user && user.uid === stream.creatorId) {
       setHasAccess(true);
       return;
     }

     if (!user) {
        setHasAccess(false);
        return;
     }

     const checkAccess = async () => {
        try {
          // Check access ledger
          const snap = await getDocs(query(collection(db, 'streams', stream.id, 'access'), where('__name__', '==', user.uid)));
          if (!snap.empty) {
             setHasAccess(true);
          } else {
             setHasAccess(false);
          }
        } catch(e) {
          setHasAccess(false);
        }
     };
     checkAccess();
  }, [stream.pricePerView, user, stream.creatorId, stream.id]);

  const handleUnlock = async () => {
     if (!user) return alert("Please log in to purchase access");
     setUnlocking(true);
     try {
       // Mock Demo payment flow: Write securely to the access ledger
       await setDoc(doc(db, 'streams', stream.id, 'access', user.uid), {
         grantedAt: serverTimestamp()
       });
       setHasAccess(true);
     } catch (err) {
       console.error(err);
       alert("Failed to purchase access.");
     }
     setUnlocking(false);
  };

  return (
    <div className="h-full w-full relative">
      {/* Video Background */}
      <video
        ref={videoRef}
        src={stream.videoUrl}
        loop
        muted
        playsInline
        className={cn("h-full w-full object-cover transition-all duration-700", !hasAccess && "blur-xl brightness-50")}
      />

      {/* Paywall Overlay */}
      {!hasAccess && (
         <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/60 pointer-events-auto backdrop-blur-sm p-6 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
               <DollarSign size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Premium Stream</h2>
            <p className="text-zinc-400 max-w-xs mb-8">Purchase a ticket to unlock {stream.creatorName}'s exclusive live content right now.</p>
            
            <button 
              onClick={handleUnlock}
              disabled={unlocking}
              className="bg-white text-black px-10 py-4 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all w-full max-w-xs"
            >
              {unlocking ? "Processing..." : `UNLOCK TICKET • $${stream.pricePerView?.toFixed(2)}`}
            </button>
            <p className="text-[10px] text-zinc-600 mt-4 uppercase font-bold tracking-widest">(Demo Mode: Click to test)</p>
         </div>
      )}

      {/* Overlay Content */}
      <div className={cn("absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500", !hasAccess && "opacity-0 pointer-events-none")}>
        {/* Top Info */}
        <div className="flex justify-between items-start pt-8 pointer-events-auto">
          <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/10">
            <img src={stream.creatorAvatar} alt={stream.creatorName} className="w-8 h-8 rounded-full border border-white/20" />
            <div>
              <p className="text-sm font-bold leading-tight">{stream.creatorName}</p>
              <p className="text-[10px] text-zinc-300 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse" />
                {stream.viewerCount.toLocaleString()} watching
              </p>
            </div>
            <button className="ml-2 bg-white text-black px-3 py-1 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">
              Follow
            </button>
          </div>
          
          <div className="flex flex-col space-y-4">
             <StreamControl icon={<ShoppingCart size={22} />} label="Store" onClick={() => setShowShop(true)} badge={stream.products.length} />
             <StreamControl icon={<ListFilter size={22} />} label="Poll" onClick={() => setShowPoll(true)} active={showPoll} />
          </div>
        </div>

        {/* Bottom Info & Interaction */}
        <div className="flex items-end justify-between pointer-events-auto">
          <div className="flex-1 mr-4">
             <h3 className="text-lg font-bold mb-1">{stream.title}</h3>
             <div className="flex flex-wrap gap-2 mb-4">
                {stream.products.slice(0, 2).map(p => (
                  <div key={p.id} className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10 flex items-center space-x-2 transition-transform hover:scale-105 cursor-pointer" onClick={() => setShowShop(true)}>
                    <img src={p.image} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="text-xs font-medium truncate w-24">{p.name}</p>
                      <p className="text-xs font-bold text-white">${p.price}</p>
                    </div>
                  </div>
                ))}
             </div>
             
             {/* Live Chat component injected here */}
             <div className="mt-2 w-full max-w-sm">
                <LiveChat streamId={stream.id} />
             </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex flex-col items-center space-y-6 pb-4">
            <div className="flex flex-col items-center">
              <button 
                onClick={() => setLiked(!liked)}
                className={cn("p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-colors", liked && "text-red-500")}
              >
                <Heart size={28} fill={liked ? "currentColor" : "none"} />
              </button>
              <span className="text-xs font-bold mt-1">45.2k</span>
            </div>
            
            <div className="flex flex-col items-center">
              <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <MessageCircle size={28} />
              </button>
              <span className="text-xs font-bold mt-1">820</span>
            </div>

            <div className="flex flex-col items-center">
              <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <Share2 size={28} />
              </button>
              <span className="text-xs font-bold mt-1">Share</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showShop && (
          <ShopOverlay products={stream.products} onClose={() => setShowShop(false)} />
        )}
        {showPoll && (
          <PollOverlay onClose={() => setShowPoll(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StreamControl({ icon, label, onClick, badge, active }: { icon: React.ReactNode, label: string, onClick: () => void, badge?: number, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-full bg-black/40 backdrop-blur-md border transition-all active:scale-95",
        active ? "border-white bg-white text-black" : "border-white/10 text-white"
      )}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-black font-bold">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function ChatMessage({ user, text }: { user: string, text: string }) {
  return (
    <div className="flex items-start space-x-2 text-sm">
      <span className="font-bold text-zinc-400">{user}</span>
      <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{text}</span>
    </div>
  );
}

function ShopOverlay({ products, onClose }: { products: Product[], onClose: () => void }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    async function loadRecs() {
      setLoadingRecs(true);
      const recs = await getProductRecommendations(MOCK_USER.interests, MOCK_USER.purchaseHistory);
      setRecommendations(recs);
      setLoadingRecs(false);
    }
    loadRecs();
  }, []);

  const handleBuy = async (product: Product) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price
        })
      });
      const data = await res.json();
      if (data.url && data.url !== '#') {
        window.location.href = data.url;
      } else {
        alert(data.message || "Purchase successful! (Demo Mode)");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate purchase.");
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-x-0 bottom-0 top-1/3 bg-zinc-950 rounded-t-3xl border-t border-white/10 z-[100] flex flex-col pointer-events-auto"
    >
      <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <ShoppingBag className="mr-2" size={24} />
                Stream Store
              </h2>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>

        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center space-x-4 border border-white/5">
              <img src={product.image} className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{product.name}</h4>
                <p className="text-zinc-400 text-xs line-clamp-2 mb-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-black">${product.price}</span>
                  <button 
                    onClick={() => handleBuy(product)}
                    className="bg-white text-black px-4 py-2 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Recommendation Section */}
        <div className="mt-12">
           <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 px-2 flex items-center">
             <Sparkles className="mr-2 text-yellow-500" size={14} />
             Chosen for you by AI
           </h3>
           <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar px-2">
              {loadingRecs ? (
                <div className="flex space-x-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-40 h-48 bg-zinc-900 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="flex-shrink-0 w-40 bg-zinc-900 rounded-xl p-3 border border-white/10 group cursor-pointer">
                    <img src={`https://picsum.photos/seed/rec${i}/200/200`} className="w-full aspect-square rounded-lg object-cover mb-3 grayscale group-hover:grayscale-0 transition-all" />
                    <p className="text-xs font-bold truncate">{rec.title}</p>
                    <p className="text-xs text-zinc-500">${rec.price}</p>
                  </div>
                ))
              )}
              {!loadingRecs && recommendations.length === 0 && (
                <p className="text-xs text-zinc-600 px-2 italic">Connect your account for personalized tips.</p>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function PollOverlay({ onClose }: { onClose: () => void }) {
  const [voted, setVoted] = useState<string | null>(null);
  const options = [
    { id: '1', text: 'YES, buying right now!', votes: 72 },
    { id: '2', text: 'Wait for the next color...', votes: 12 },
    { id: '3', text: 'Maybe next time', votes: 16 }
  ];

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center p-6 z-[110] bg-black/40 backdrop-blur-md pointer-events-auto"
    >
      <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20">
          <Plus className="rotate-45" size={16} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2 leading-tight">Drop your opinion!</h2>
          <p className="text-zinc-500 text-sm mb-8">Participate in the live poll to unlock a discount code.</p>
          
          <div className="w-full space-y-3">
            {options.map(opt => (
              <button 
                key={opt.id}
                onClick={() => setVoted(opt.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all relative overflow-hidden text-left",
                  voted === opt.id ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/30"
                )}
              >
                <div className="relative z-10 flex justify-between items-center">
                  <span className={cn("font-bold", voted === opt.id ? "text-blue-400" : "text-white")}>{opt.text}</span>
                  {voted && <span className="text-xs font-black">{opt.votes}%</span>}
                </div>
                {voted && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${opt.votes}%` }}
                    className="absolute inset-y-0 left-0 bg-blue-500/20 z-0"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Profile({ user }: { user: typeof MOCK_USER }) {
  return (
    <div className="max-w-2xl mx-auto pt-10">
      <div className="flex items-center space-x-6 mb-10">
        <div className="relative">
          <img src={user.avatar} className="w-24 h-24 rounded-full border-2 border-white/10 p-1" />
          <button className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full border-2 border-zinc-950">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight">{user.name}</h1>
          <p className="text-zinc-400 text-sm mt-1">{user.bio}</p>
          <div className="mt-4 flex space-x-4">
            <button className="bg-white text-black px-6 py-2 rounded-xl font-bold text-sm tracking-tight active:scale-95 transition-all">
              Edit Profile
            </button>
            <button className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold text-sm tracking-tight active:scale-95 transition-all">
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Purchases</p>
          <p className="text-3xl font-black">12</p>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Following</p>
          <p className="text-3xl font-black">248</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black">Interest Feed</h2>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden animate-pulse">
              <img src={`https://picsum.photos/seed/grid${i}/300/300`} className="w-full h-full object-cover opacity-50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Discover() {
  const categories = ["For You", "Beauty", "Tech", "Fashion", "Gaming", "Home"];
  return (
    <div className="pt-10">
      <h1 className="text-3xl font-black mb-8">Discover</h1>
      
      <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-8">
        {categories.map(c => (
          <button key={c} className="whitespace-nowrap px-6 py-2 bg-zinc-900 rounded-full text-sm font-bold border border-white/5 hover:border-white/20 transition-all">
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer">
            <img src={`https://picsum.photos/seed/discover${i}/400/600`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <p className="text-sm font-bold">Trending Stream {i}</p>
              <div className="flex items-center text-[10px] text-zinc-400 mt-1">
                <Compass size={10} className="mr-1" />
                <span>12.4k viewers</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessPage() {
  return (
    <div className="h-full bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">SUCCESS!</h1>
      <p className="text-zinc-500 max-w-xs mb-8 font-medium">Your package is processed. Check your profile for updates.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
      >
        Back to Feed
      </button>
    </div>
  );
}

function CreatorDashboard() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [streamPrice, setStreamPrice] = useState<number>(0);

  const handleGoLive = async () => {
    if (!user) {
      await login();
      return;
    }
    setLoading(true);
    try {
       // Check if user already exists
       const userSnap = await getDocs(query(collection(db, 'users')));
       const userExists = userSnap.docs.find(d => d.id === user.uid);
       if (!userExists) {
         await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/150/150`,
            createdAt: serverTimestamp()
         });
       }

       // Create the stream
       const streamRef = doc(collection(db, 'streams'));
       const mockProdKeys = MOCK_STREAMS[0].products;
       await setDoc(streamRef, {
         creatorId: user.uid,
         creatorName: user.displayName || 'VibeFlow User',
         creatorAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/150/150`,
         title: `${user.displayName || 'My'} Live Stream! 🚀`,
         videoUrl: MOCK_STREAMS[Math.floor(Math.random() * MOCK_STREAMS.length)].videoUrl,
         isActive: true,
         viewerCount: 0,
         products: mockProdKeys,
         pricePerView: streamPrice,
         createdAt: serverTimestamp()
       });
       alert("You are now LIVE! Check the home feed.");
    } catch(err) {
       console.error("Go Live Error:", err);
       alert("Error starting stream.");
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black">Creator Studio</h1>
          <button onClick={handleGoLive} disabled={loading} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold flex items-center space-x-2 animate-pulse hover:animate-none">
             {!loading && <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
             <span>{loading ? 'STARTING...' : 'GO LIVE'}</span>
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <CreatorStat label="Earnings" value="$1,240.50" icon={<DollarSign className="text-green-500" />} />
          <CreatorStat label="Live Viewers" value="842" icon={<User className="text-blue-500" />} />
          <CreatorStat label="Conversions" value="4.2%" icon={<ShoppingBag className="text-purple-500" />} />
       </div>

       <div className="flex-1 bg-zinc-900/30 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8">
          <div className="w-full max-w-sm bg-zinc-900 p-6 rounded-2xl border border-white/5 mb-8">
             <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Stream Settings</h3>
             
             <div className="flex flex-col space-y-2 mb-6 text-left">
               <label className="text-xs font-bold text-zinc-400">TICKET PRICE: ${streamPrice.toFixed(2)}</label>
               <input 
                 type="range" 
                 min="0" max="50" step="1"
                 value={streamPrice}
                 onChange={(e) => setStreamPrice(Number(e.target.value))}
                 className="w-full accent-blue-500"
               />
               <p className="text-[10px] text-zinc-600 mt-1">Set to $0 for a free public stream.</p>
             </div>
             
          </div>

          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
             <Compass size={40} className="text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">No active stream recordings</h3>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">Start a live stream to see your metrics and engagement data appear here.</p>
          <button className="mt-8 text-blue-400 font-bold hover:underline">Learn about our Affiliate Program</button>
       </div>
    </div>
  );
}

function CreatorStat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5">
       <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
          {icon}
       </div>
       <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}
