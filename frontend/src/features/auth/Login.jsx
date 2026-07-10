import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';
import LampSwitch from './LampSwitch';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom states for lamp animation
  const [isLampOn, setIsLampOn] = useState(false);
  
  const { login } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate(`/${result.role}`);
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const handleToggleLamp = () => {
    setIsLampOn(true); 
  };

  // Determine background color based on theme and lamp state
  const bgClass = isDarkMode ? 'bg-[#0f1115]' : 'bg-gray-100';

  return (
    <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-1000 ${bgClass}`}>
      
      {/* Cinematic Ambient Beam (Massive background lighting) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out z-0 pointer-events-none ${isLampOn ? 'opacity-100' : 'opacity-0'}`}>
        {/* The ambient room fill that illuminates the whole area behind the login form */}
        <div 
          className="absolute inset-0"
          style={{
            background: isDarkMode 
              ? 'radial-gradient(120% 120% at 25% 20%, rgba(253,224,71,0.12) 0%, transparent 60%)'
              : 'radial-gradient(120% 120% at 25% 20%, rgba(99,102,241,0.15) 0%, transparent 60%)'
          }}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto flex items-center justify-center relative min-h-[650px] p-4">
        
        {/* Logo Switch Section */}
        <div 
          className={`absolute z-10 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center ${
            isLampOn 
              ? 'left-1/2 md:left-[18%] -translate-x-1/2 top-[5%] md:top-1/2 md:-translate-y-1/2 scale-[0.6] md:scale-75 lg:scale-[0.85]' 
              : 'left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 scale-100'
          }`}
        >
          <LampSwitch 
            isOn={isLampOn} 
            onToggle={handleToggleLamp} 
            isDarkMode={isDarkMode} 
          />
        </div>

        {/* Login Form Section */}
        <div 
          className={`w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-[24px] shadow-2xl border border-gray-100/50 p-8 sm:p-10 relative z-20 flex flex-col transition-all duration-1000 delay-300 ease-out ${
            isLampOn 
              ? 'opacity-100 translate-x-0 md:translate-x-[45%] lg:translate-x-[60%]' 
              : 'opacity-0 translate-x-[100px] pointer-events-none'
          }`}
        >
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="text-primary-600 font-extrabold text-2xl tracking-tight flex flex-col items-center gap-4 w-full">
                <img src="/logo.png" alt="College Logo" className="w-full max-w-[320px] h-auto object-contain drop-shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="flex items-center text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">
                  CampusConnect
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Welcome back
            </h2>
            <p className="text-[15px] text-gray-500">
              Sign in to your Smart Campus portal
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 text-[15px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50/50 transition-all outline-none"
                placeholder="you@svcet.edu"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 pr-12 text-[15px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50/50 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-[15px] font-bold text-white transition-all shadow-md ${
                  isLoading ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/30 shadow-primary-500/20'
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in \u2192'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
