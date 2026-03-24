'use client';
import { FileSignature } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';

const FeatureContent = () => {
  return (
    <>
      <motion.div
        initial={{
          y: 10,
          filter: 'blur(10px)',
          opacity: 0,
        }}
        whileInView={{
          y: 0,
          filter: 'blur(0px)',
          opacity: 1,
        }}
        transition={{
          duration: 0.3,
          delay: 0.1,
          ease: 'easeInOut',
        }}
        viewport={{ once: true }}
        className="mb-2"
      >
        <FileSignature />
      </motion.div>
      <motion.h1
        initial={{
          y: 10,
          filter: 'blur(10px)',
          opacity: 0,
        }}
        whileInView={{
          y: 0,
          filter: 'blur(0px)',
          opacity: 1,
        }}
        transition={{
          duration: 0.4,
          delay: 0.1,
          ease: 'easeInOut',
        }}
        viewport={{ once: true }}
        className="mx-auto mb-2 max-w-3xl text-balance bg-linear-to-br from-neutral-100 via-neutral-100 via-50% to-neutral-100/30 bg-clip-text py-2 text-center text-4xl font-medium leading-[1.1] tracking-tighter text-transparent md:text-5xl"
      >
        Built for Developers Who Value Simplicity and Speed
      </motion.h1>
      <motion.p
        initial={{
          y: 10,
          filter: 'blur(10px)',
          opacity: 0,
        }}
        whileInView={{
          y: 0,
          filter: 'blur(0px)',
          opacity: 1,
        }}
        transition={{
          duration: 0.3,
          delay: 0.2,
          ease: 'easeInOut',
        }}
        viewport={{ once: true }}
        className="mb-8 max-w-sm text-balance bg-linear-to-br from-white/70 via-white/70 to-white/30 bg-clip-text text-center text-[0.8rem] text-transparent sm:max-w-lg sm:text-[0.87rem] lg:text-[1rem]"
      >
        Statsio provides fast, flexible analytics with a minimal footprint
        delivering clarity without clutter and only meaningful insights
      </motion.p>
    </>
  );
};

export default FeatureContent;
