export default function Glow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div 
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
        style={{ background: '#B37FEB' }}
      ></div>
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-20 blur-[150px]"
        style={{ background: 'linear-gradient(135deg, #FF27F0 0%, #29FF64 100%)' }}
      ></div>
    </div>
  );
}