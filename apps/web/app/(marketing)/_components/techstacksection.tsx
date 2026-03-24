'use client';

import { Database, Code2, Wind, Atom, Triangle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TechStackSection = () => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
        filter: 'blur(10px)',
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: 0.3,
        delay: 0.25,
        ease: 'easeInOut',
      }}
      viewport={{ once: true }}
      className="flex items-center gap-4 pt-2 text-neutral-400"
    >
      <p className="text-sm text-neutral-400 md:text-[1rem]">Built with</p>
      <div>
        <Triangle className="size-5 md:size-6" />
      </div>
      <div>
        <Database className="size-5 md:size-6" />
      </div>
      <div>
        <Zap className="size-4 md:size-5" />
      </div>
      <div>
        <Atom className="size-4 md:size-5" />
      </div>
      <div>
        <Code2 className="size-4 md:size-5" />
      </div>
      <div>
        <Wind className="size-4 md:size-5" />
      </div>
    </motion.div>
  );
};
export default TechStackSection;
