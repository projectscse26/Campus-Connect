import React from 'react';

const LampSwitch = ({ isOn, onToggle, isDarkMode }) => {
  // The glow effect applied to the logo when "turned on"
  const darkGlow = 'drop-shadow-[0_0_60px_rgba(253,224,71,0.8)]'; 
  const lightGlow = 'drop-shadow-[0_0_60px_rgba(99,102,241,0.8)]'; 
  const glowStyle = isOn ? (isDarkMode ? darkGlow : lightGlow) : '';

  return (
    <div className="relative flex flex-col items-center justify-center select-none z-30">
      {/* Cinematic Ambient Room Light - The "shade" effect */}
      <div 
        className={`absolute pointer-events-none transition-opacity duration-1000 ease-in-out ${isOn ? 'opacity-100' : 'opacity-0'}`}
        style={{
          top: '50%', 
          left: '50%', 
          width: '250vw', 
          height: '250vh', 
          transform: 'translate(-50%, -50%)',
          background: isDarkMode 
            ? 'radial-gradient(circle at 50% 50%, rgba(253,224,71,0.25) 0%, rgba(253,224,71,0.08) 30%, transparent 60%)' 
            : 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.08) 30%, transparent 60%)',
          zIndex: -1
        }}
      />
      
      {/* Clickable Logo and Text */}
      <div 
        onClick={onToggle}
        className="flex flex-col items-center cursor-pointer transition-all duration-700 ease-in-out transform hover:scale-105 active:scale-95"
      >
        <img 
          src="/logo2.png" 
          alt="SVCET Logo" 
          className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain animate-in fade-in zoom-in-95 duration-1000"
          style={{
            filter: isDarkMode 
              ? `drop-shadow(0px 0px ${isOn ? '60px' : '35px'} rgba(255, 255, 255, ${isOn ? '0.9' : '0.5'}))`
              : `drop-shadow(0px 0px ${isOn ? '60px' : '35px'} rgba(99, 102, 241, ${isOn ? '0.9' : '0.5'}))`
          }}
        />
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl font-black mt-6 md:mt-8 tracking-widest text-center uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both delay-300"
          style={{ 
            color: isDarkMode ? '#ffffff' : '#111827',
            textShadow: isDarkMode 
              ? `0 0 ${isOn ? '25px' : '15px'} rgba(255,255,255,${isOn ? '0.6' : '0.3'})`
              : `0 0 ${isOn ? '25px' : '15px'} rgba(99,102,241,${isOn ? '0.4' : '0.2'})`
          }}
        >
          SVCET
        </h1>

        {!isOn && (
          <p 
            className="mt-8 text-sm sm:text-base font-bold animate-bounce animate-in fade-in duration-1000 delay-500 fill-mode-both"
            style={{ color: isDarkMode ? '#f3f4f6' : '#6b7280' }}
          >
            Click to Login
          </p>
        )}
      </div>
    </div>
  );
};

export default LampSwitch;
