'use client';

import Hero from '@/app/(marketing)/_components/hero';
import Workflow from '@/app/(marketing)/_components/workflow';
import Benefits from '@/app/(marketing)/_components/benefits';
import Security from '@/app/(marketing)/_components/security';

export default function LandingPage() {
  return (
    <main className="bg-default min-h-screen">
      <Hero/>

      <Workflow/>

      <Benefits/>

      <Security/>
    </main>
  );
}
