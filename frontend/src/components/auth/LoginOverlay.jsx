import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal } from '../../context/AuthModalContext';
import { LoginForm } from './LoginForm';

export const LoginOverlay = () => {
  const { isLoginOpen, closeLogin } = useAuthModal();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLoginOpen) {
        closeLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginOpen, closeLogin]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isLoginOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoginOpen]);

  return (
    <AnimatePresence>
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Glass / Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={closeLogin}
            className="fixed inset-0 bg-[#0B1B3A]/40 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Centered White Glass Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ 
              type: 'spring', 
              damping: 26, 
              stiffness: 340, 
              mass: 0.85 
            }}
            className="relative z-10 w-full max-w-[460px] my-auto bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-[0_24px_70px_rgba(15,35,80,0.22)] border border-white/90"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loginModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <LoginForm onClose={closeLogin} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginOverlay;