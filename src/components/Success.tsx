export default function Success() {
  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-black mb-2">Purchase Successful!</h1>
      <p className="text-zinc-500 max-w-sm mb-8">Your product is being prepared. Check your profile for tracking details.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm"
      >
        Back to Feed
      </button>
    </div>
  )
}
