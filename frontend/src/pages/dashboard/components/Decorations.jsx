import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    rotate: [0, 2, -2, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

export function Decorations() {
  return (
    <>
      <motion.div
        variants={floatVariants}
        animate="animate"
        className="absolute top-20 right-10 z-0 hidden lg:block"
      >
        <div className="retro-smiley text-xl animate-wobble">😎</div>
      </motion.div>

      <motion.div
        variants={floatVariants}
        animate="animate"
        className="absolute bottom-32 left-20 z-0 hidden lg:block"
        style={{ animationDelay: '1s' }}
      >
        <Star className="w-8 h-8 text-retro-yellow fill-retro-yellow drop-shadow-retro animate-sparkle-retro" />
      </motion.div>

      <motion.div
        variants={floatVariants}
        animate="animate"
        className="absolute top-1/3 right-1/4 z-0 hidden xl:block"
        style={{ animationDelay: '2s' }}
      >
        <ArrowRight className="w-10 h-10 text-retro-orange drop-shadow-retro rotate-[-45deg] animate-wobble" />
      </motion.div>

      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-retro-purple/20 rounded-blob blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-retro-lime/20 rounded-blob blur-2xl pointer-events-none" />
    </>
  );
}
