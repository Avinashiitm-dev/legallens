export function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#09090b]">
      {/* 
        We use raw CSS animations with opacity/transform to avoid CPU layout repaints.
      */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute -top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-orange-500/20 blur-[120px] mix-blend-screen opacity-50"
          style={{ animation: 'float-slow 15s ease-in-out infinite alternate' }}
        />
        <div 
          className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen opacity-50"
          style={{ animation: 'float-slow 20s ease-in-out infinite alternate-reverse' }}
        />
        <div 
          className="absolute bottom-[-10%] left-[30%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 blur-[130px] mix-blend-screen opacity-40"
          style={{ animation: 'float-slow 18s ease-in-out infinite alternate' }}
        />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-slow {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, 5%) scale(1.05); }
          66% { transform: translate(-2%, 2%) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}} />
    </div>
  );
}
