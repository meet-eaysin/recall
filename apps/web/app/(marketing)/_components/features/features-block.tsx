'use client';

import React from 'react';
import FeatureContent from './feature-content';
import FrameworkAgnostic from './framework-agnostic';
import SecurityCard from './security-card';
import FraudCard from './fraud-card';
import BotDetection from './bot-detection';
import VaultLock from './vault-lock';
import { motion } from 'motion/react';

const FeaturesBlock = () => {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center gap-4 px-2 py-12 lg:pb-24 lg:pt-36">
      <FeatureContent />
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          viewport={{ once: true }}
          className="lg:col-span-2"
        >
          <FrameworkAgnostic />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          viewport={{ once: true }}
          className="lg:col-span-1"
        >
          <SecurityCard />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          viewport={{ once: true }}
          className="lg:col-span-1"
        >
          <VaultLock />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          viewport={{ once: true }}
          className="lg:col-span-1"
        >
          <BotDetection />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          viewport={{ once: true }}
          className="lg:col-span-1"
        >
          <FraudCard
            nodes={[
              { label: 'Semantic Link', status: 'Connected' },
              { label: 'Contextual Node', status: 'Mapped' },
              { label: 'Entity Extraction', status: 'Indexed' },
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturesBlock;
