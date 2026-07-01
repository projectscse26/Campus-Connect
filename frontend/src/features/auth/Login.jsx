import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
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

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[10%] w-[40vw] h-[40vw] bg-blue-100/50 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-indigo-100/50 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />

      <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-2xl border border-gray-100 p-8 sm:p-10 relative z-10 flex flex-col">
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="text-primary-600 font-extrabold text-2xl tracking-tight flex items-center">
              <span className="text-3xl mr-1.5">^</span>CampusConnect
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
              className="block w-full px-4 py-3 text-[15px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 transition-all outline-none"
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
                className="block w-full px-4 py-3 pr-12 text-[15px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 transition-all outline-none"
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
  );
}
