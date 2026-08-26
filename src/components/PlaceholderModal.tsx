import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bell, ArrowLeft, Construction, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export const PlaceholderModal: React.FC<PlaceholderModalProps> = ({
  isOpen,
  onClose,
  featureName = "This Feature"
}) => {
  const [notified, setNotified] = useState(false);

  if (!isOpen) return null;

  const handleNotify = () => {
    setNotified(true);
    toast.success("You're on the priority VIP list!", {
      description: `We will notify your registered email as soon as ${featureName} goes live.`,
      icon: <Sparkles className="w-5 h-5 text-[#FFD166]" />
    });
    setTimeout(() => {
      setNotified(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md p-8 text-center border shadow-2xl rounded-2xl bg-[#151922] border-[#2A3242] overflow-hidden"
          style={{
            boxShadow: "0 0 40px rgba(229, 9, 20, 0.15), 0 20px 40px rgba(0,0,0,0.6)"
          }}
        >
          {/* Subtle top glow bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E50914] via-[#FF3D5A] to-[#FFD166]" />

          {/* Animated Icon Circle */}
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#E50914]/20 to-[#FFD166]/20 border border-[#2A3242] shadow-inner"
          >
            <Construction className="w-10 h-10 text-[#FFD166] animate-pulse" />
          </motion.div>

          <h3 className="text-2xl font-bold tracking-tight text-[#F5F7FA] mb-2 font-['Poppins']">
            🚧 We're working on this feature.
          </h3>
          <p className="text-[#FFD166] font-medium text-sm mb-4">
            {featureName} is currently under development.
          </p>
          <p className="text-[#B8C0CC] text-sm leading-relaxed mb-8">
            This feature will be available in a future update as part of our continuous CineX platform rollout. Thank you for your patience!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-[#0B0D12] text-[#F5F7FA] border border-[#2A3242] hover:bg-[#2A3242]/50 hover:border-[#F5F7FA]/30 transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNotify}
              disabled={notified}
              className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all shadow-lg cursor-pointer ${
                notified
                  ? "bg-green-600 border border-green-500"
                  : "bg-gradient-to-r from-[#E50914] to-[#FF3D5A] hover:shadow-[0_0_20px_rgba(229,9,20,0.5)] border border-[#FF3D5A]/30"
              }`}
            >
              {notified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" /> Added to VIP List
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" /> Notify Me
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
