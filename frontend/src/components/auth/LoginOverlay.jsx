import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal } from '../../context/AuthModalContext';
import { GlassScene } from '../login/GlassScene';
import { GlassLoginForm } from '../login/GlassLoginForm';

export const LoginOverlay = () => {
  const { isLoginOpen, closeLogin, initialTab } = useAuthModal();

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

  const initialView =
    initialTab === 'SIGNUP' ? 'signup' : initialTab === 'ADMIN' ? 'admin' : 'signin';

  return (
    <AnimatePresence>
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Frosted Backdrop over the Landing Page with Floating Glass Bubbles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={closeLogin}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-md overflow-hidden cursor-pointer"
            aria-hidden="true"
          >
            <GlassScene />
          </motion.div>

          {/* Centered White Frosted Glass Card with Chamfered Corners and 3D Tilt */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ 
              type: 'spring', 
              damping: 26, 
              stiffness: 320, 
              mass: 0.85 
            }}
            className="relative z-10 w-full max-w-[460px] my-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loginModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassLoginForm onClose={closeLogin} initialView={initialView} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginOverlay;
