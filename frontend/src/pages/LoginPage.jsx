import React from 'react';
import { GlassLoginForm } from '../components/login/GlassLoginForm';
import { GlassScene } from '../components/login/GlassScene';
import { RobertMascot } from '../components/RobertMascot';

export const LoginPage = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <GlassScene />
      <RobertMascot />
      <div className="relative z-10 w-full max-w-[480px]">
        <GlassLoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
