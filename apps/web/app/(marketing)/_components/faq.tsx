'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className={cn(
        'group rounded-lg border-[0.5px] border-neutral-800/50',
        'transition-all duration-200 ease-in-out',
        isOpen
          ? 'bg-linear-to-br via-white/2 from-white/5 to-white/5'
          : 'hover:bg-white/2',
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-2 py-4"
      >
        <h3
          className={cn(
            'text-left text-base font-medium transition-colors duration-200',
            'text-zinc-300',
            isOpen && 'text-white',
          )}
        >
          {question}
        </h3>
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.1 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
          className={cn(
            'shrink-0 rounded-full p-0.5',
            'transition-colors duration-200',
            isOpen ? 'text-white' : 'text-zinc-500',
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: {
                  duration: 0.4,
                  ease: [0.04, 0.62, 0.23, 0.98],
                },
                opacity: {
                  duration: 0.25,
                  delay: 0.1,
                },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: {
                  duration: 0.3,
                  ease: 'easeInOut',
                },
                opacity: {
                  duration: 0.25,
                },
              },
            }}
          >
            <div className="px-2 pb-4 pt-2">
              <motion.p
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: 'easeOut',
                }}
                className="text-sm leading-relaxed text-neutral-400"
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQ() {
  const faqs: Omit<FAQItemProps, 'index'>[] = [
    {
      question: 'What is Recall?',
      answer:
        'Recall is a personal knowledge engine built for developers. It helps you capture, search, and connect ideas using AI-powered insights, keeping your library organized and accessible.',
    },
    {
      question: 'Is my data private?',
      answer:
        'Yes! Recall is built with privacy-first principles. Your data is isolated per-user, and we use a local-first approach where possible to ensure your knowledge stays your own.',
    },
    {
      question: 'What can I store in Recall?',
      answer:
        'You can store anything from technical documentation and research papers to personal notes and bookmarks. Recall automatically indexes and connects them in your knowledge graph.',
    },
    {
      question: 'Is Recall free to use?',
      answer:
        'Yes! Recall is open-source and free to use. You can even self-host it for full control over your infrastructure and data.',
    },
    {
      question: 'How does the AI work?',
      answer:
        'Recall uses advanced RAG (Retrieval-Augmented Generation) to ground AI answers in your personal library. This means you get citations and sources for every answer.',
    },
    {
      question: 'Can I self-host Recall?',
      answer:
        'Yes, Recall is designed to be easily deployable using Docker. You can host it on your own server or use our managed version for convenience.',
    },
  ];

  return (
    <section className="bg-linear-to-b w-full from-transparent via-white/2 to-transparent py-24">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4"
      >
        <motion.div className="mx-auto mb-12 max-w-7xl text-center">
          <FileQuestion />
          <h2 className="mx-auto mb-2 mt-6 max-w-3xl text-balance bg-linear-to-br from-neutral-100 via-neutral-100 via-50% to-neutral-100/30 bg-clip-text py-2 text-center text-4xl font-medium leading-[1.1] tracking-tighter text-transparent md:text-5xl">
            Let&apos;s Answer Your Questions
          </h2>
          <p className="mb-8 text-balance bg-linear-to-br from-white/70 via-white/70 to-white/30 bg-clip-text text-center text-[0.8rem] text-transparent sm:text-[0.87rem] lg:text-[1rem]">
            Everything you need to know about our platform
          </p>
        </motion.div>

        <div className="mx-auto max-w-2xl space-y-2">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default FAQ;
