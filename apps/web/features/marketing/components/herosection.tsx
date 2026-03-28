'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Herobuttons from './hero-buttons';
import HeroBadge from './herobadge';

const HeroSection = () => {
  return (
    <div className="mx-auto flex min-h-screen flex-col items-center justify-center">
      <div
        className={cn(
          'flex h-full min-h-[99.5vh] w-full max-w-[99.5%] justify-center rounded-b-2xl',
          'bg-[radial-gradient(125%_125%_at_50%_101%,rgba(80,140,240,0.7)_0%,rgba(60,120,220,0.6)_15%,rgba(40,90,200,0.5)_30%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,1)_70%,rgba(0,0,0,1)_100%)]',
        )}
      >
        <div
          className={cn(
            'mt-tab flex h-full min-h-[99.5vh] w-full flex-col justify-center rounded-b-2xl sm:mt-48 md:mt-48 lg:mt-0 lg:flex-row',
          )}
        >
          <div className="flex lg:flex-2">
            <div className="flex flex-col justify-center space-y-5 pl-6 lg:mx-auto lg:max-w-4xl xl:pl-2">
              <HeroBadge />
              <motion.h1
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
                  ease: 'easeInOut',
                }}
                viewport={{ once: true }}
                className="max-w-lg whitespace-pre-wrap text-balance font-sans text-4xl font-bold tracking-tight text-white md:max-w-4xl md:text-5xl"
              >
                Unlock Your Personal Knowledge Engine
              </motion.h1>
              <motion.p
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
                  delay: 0.1,
                  ease: 'easeInOut',
                }}
                viewport={{ once: true }}
                className="max-w-sm text-balance text-[0.95rem] text-neutral-400 sm:max-w-lg md:text-[1.1rem] lg:max-w-md"
              >
                Recall is an open-source tool for developers to capture, search,
                and connect ideas with AI-powered insights.
              </motion.p>
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
                  delay: 0.2,
                  ease: 'easeInOut',
                }}
                viewport={{ once: true }}
                className="flex items-start"
              >
                <Herobuttons />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
