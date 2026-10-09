export function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dynamic Cursor Spotlight Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ 
          background: "radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 30%), rgba(217, 119, 6, 0.22), rgba(180, 83, 9, 0.08) 35%, transparent 75%)",
          willChange: "background"
        }}
      />
      
      {/* 
        Raw CSS animations for floating orbs behind the spotlight
      */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div 
          className="absolute -top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-orange-500/20 blur-[120px] mix-blend-screen opacity-50"
          style={{ animation: 'float-slow 15s ease-in-out infinite alternate', willChange: 'transform' }}
        />
        <div 
          className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen opacity-50"
          style={{ animation: 'float-slow 20s ease-in-out infinite alternate-reverse', willChange: 'transform' }}
        />
        <div 
          className="absolute bottom-[-10%] left-[30%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 blur-[130px] mix-blend-screen opacity-40"
          style={{ animation: 'float-slow 18s ease-in-out infinite alternate', willChange: 'transform' }}
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
