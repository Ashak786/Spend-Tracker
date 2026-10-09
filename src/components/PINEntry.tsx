import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

interface PINEntryProps {
  onVerify: () => void;
}

export default function PINEntry({ onVerify }: PINEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      if (newPin === '080123') {
        onVerify();
      } else if (newPin.length === 6) {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4"
    >
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Secure Access</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Please enter your 6-digit PIN to continue.</p>
        </div>

        <div className="flex justify-center gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold
                ${pin.length > i ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'border-slate-200 dark:border-slate-800'}
                ${error ? 'border-rose-500 text-rose-500' : ''}
              `}
            >
              {pin[i] ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm font-bold text-rose-500">Invalid PIN. Try again.</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((item) => (
            <button
              key={item}
              onClick={() => {
                if (item === 'C') { setPin(''); setError(false); }
                else if (item === '⌫') { handleBackspace(); }
                else { handleDigit(item.toString()); }
              }}
              className="h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-xl text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
