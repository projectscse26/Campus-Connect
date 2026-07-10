import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw } from 'lucide-react';

/**
 * Smart router component that redirects authority users to their specific dashboard
 * based on their title (Principal, Dean, Office Manager, Vice Principal)
 */
const AuthorityDashboardRouter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'authority') {
      console.log('Authority user detected:', user);
      console.log('Authority title:', user.title);
      
      if (user.title) {
        // Normalize the title for comparison
        const normalizedTitle = user.title.toLowerCase().trim();
        
        // Route based on title
        if (normalizedTitle === 'dean') {
          console.log('Redirecting to /dean');
          navigate('/dean', { replace: true });
        } else if (normalizedTitle === 'principal') {
          console.log('Redirecting to /principal');
          navigate('/principal', { replace: true });
        } else if (normalizedTitle === 'office manager') {
          console.log('Redirecting to /om');
          navigate('/om', { replace: true });
        } else if (normalizedTitle === 'vice principal') {
          console.log('Redirecting to /vice-principal');
          navigate('/vice-principal', { replace: true });
        } else {
          console.warn('Unknown authority title:', user.title);
          // Stay on /authority for unknown titles
        }
      }
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Redirecting to your dashboard...</p>
        <p className="text-xs text-gray-400 mt-2">
          {user?.title ? `Loading ${user.title} Dashboard` : 'Loading...'}
        </p>
      </div>
    </div>
  );
};

export default AuthorityDashboardRouter;
