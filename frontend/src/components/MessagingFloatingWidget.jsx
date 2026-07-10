import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

/**
 * MessagingFloatingWidget
 * Floating bottom-right pill shown on every desktop page for Student and Dean roles.
 */
export default function MessagingFloatingWidget({ user, badgeCounts }) {
  const navigate = useNavigate();

  if (!user) return null;

  const isDean = user.role === 'authority' && user.title?.toLowerCase().trim() === 'dean';
  const isStudent = user.role === 'student';

  if (!isStudent && !isDean) return null;

  const messagingPath = isStudent ? '/student/messaging' : '/dean/messaging';
  const unreadCount = badgeCounts?.[messagingPath] || 0;

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-50">
      <button
        id="floating-messages-widget"
        onClick={() => navigate(messagingPath)}
        className="group flex items-center gap-2.5 bg-white border border-[#DBDBDB] rounded-full px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)] hover:scale-[1.04] active:scale-[0.97] transition-all duration-150 ease-out"
        aria-label="Open Messages"
      >
        <div className="relative">
          <MessageCircle
            className="w-[20px] h-[20px] text-[#262626] group-hover:text-black transition-colors"
            strokeWidth={2}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-[7px] -right-[7px] bg-red-500 text-white text-[9px] font-bold leading-none min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-[1.5px] border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[13px] font-semibold text-[#262626] group-hover:text-black transition-colors leading-none select-none">
          Messages
        </span>
      </button>
    </div>
  );
}
