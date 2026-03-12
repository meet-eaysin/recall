import { OmniBox } from './omni-box';
import { HomeContent } from '@/features/home/components/home-page';

export function WorkspacePage() {
  return (
    <div className="pb-32">
      <OmniBox />
      
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
         <div className="text-center mb-8">
            <h2 className="text-xs font-semibold uppercase text-muted-foreground/60">
               Your Daily Synthesis
            </h2>
         </div>
         <HomeContent />
      </div>
    </div>
  );
}
