import React, { useState, useEffect, useRef } from 'react';
import { useAuth, collection, query, orderBy, limit, onSnapshot, setDoc, serverTimestamp, doc, where } from '../lib/firebase';
import { db } from '../lib/firebase';
import { ChatMessage as ChatMessageType } from '../types';

export function LiveChat({ streamId }: { streamId: string }) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [text, setText] = useState('');
  const { user, login } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesRef = collection(db, 'streams', streamId, 'messages');
    const q = query(messagesRef, where('streamId', '==', streamId), orderBy('createdAt', 'asc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessageType[];
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => unsubscribe();
  }, [streamId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) {
      await login();
      return;
    }
    
    const msgText = text;
    setText('');
    
    try {
      const msgRef = doc(collection(db, 'streams', streamId, 'messages'));
      await setDoc(msgRef, {
        streamId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        text: msgText,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      if(err.message?.includes("Missing or insufficient permissions")) {
         alert("Could not send message. Stream might be offline.");
      } else {
         console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col justify-end pointer-events-auto w-full">
      <div className="space-y-2 h-40 overflow-y-auto no-scrollbar mask-image-fade py-2 px-1">
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start space-x-2 text-sm animate-in slide-in-from-bottom-2">
            <span className="font-bold text-zinc-300 whitespace-nowrap drop-shadow-md">{msg.userName}:</span>
            <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-tight">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Say something..." : "Sign in to chat"}
          className="flex-1 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 text-sm border border-white/10 outline-none focus:border-white/30 text-white placeholder:text-zinc-500"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-blue-400 active:scale-95 transition-all"
        >
          {user ? 'Send' : 'Login'}
        </button>
      </form>
    </div>
  );
}
