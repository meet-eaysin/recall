import { cn } from '@/lib/utils';
import { RotateCcwSquare } from 'lucide-react';

const FeatureInsights = () => {
  return (
    <div
      className={cn(
        'group relative',
        'flex flex-col justify-between',
        'h-80 space-y-4',
        'rounded-md border border-neutral-800/50 bg-neutral-950',
      )}
    >
      {/*insight card */}
      <div
        className={cn(
          'relative overflow-hidden',
          'flex items-center justify-center',
          'h-[14.7rem] w-full',
        )}
      >
        <div className="absolute bottom-0 left-4 h-32 w-56 -rotate-2 rounded-t-md bg-linear-to-br from-neutral-800/40 to-neutral-800/70 px-4 py-3 transition-all duration-300 group-hover:bottom-1">
          <div className="flex h-full w-full flex-col justify-between gap-2">
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center text-sm text-neutral-400">
                Page Views
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1 text-[0.95rem] text-white">
                  <p>6203</p>
                  <RotateCcwSquare className="text-sm text-green-600" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center text-sm text-neutral-400">
                Visitors
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1 text-[0.95rem] text-white">
                  <p>721</p>
                  <RotateCcwSquare className="text-sm text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-[31.6rem] top-[4.4rem] h-50 w-[20.3rem] rotate-2 rounded-t-md bg-linear-to-br from-neutral-800/40 to-neutral-900/80 transition-all duration-300 group-hover:top-[3.4rem]">
          <div className="flex h-full w-full flex-col gap-2.5">
            <div className="flex w-full items-center px-3 pt-2 text-sm text-neutral-400">
              Countries
            </div>
            <div className="flex w-full flex-1 flex-col gap-1 px-3">
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-full rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1" />
                  <p>India</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">53%</p>
              </div>
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-[54%] rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1" />
                  <p>United States</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">27%</p>
              </div>
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-[26%] rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1" />
                  <p>Canada</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">12%</p>
              </div>
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-[10%] rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1" />
                  <p>Japan</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">6%</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-40 h-50 w-88 rounded-t-md bg-neutral-900 shadow-xl shadow-black">
          <div className="flex h-full w-full flex-col gap-2.5">
            <div className="flex w-full items-center px-3 pt-2 text-sm text-neutral-400">
              Referrers
            </div>
            <div className="flex w-full flex-1 flex-col gap-1 px-3">
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-full rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1" />
                  <p>peerlist.io</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">37%</p>
              </div>
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-[87%] rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1 bg-black p-[2.2px]" />
                  <p>x.com</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">31%</p>
              </div>
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-[54%] rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1" />
                  <p>google.com</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">22%</p>
              </div>
              <div className="relative h-[36px] w-full rounded-md px-2 py-2">
                <div className="absolute inset-x-0 top-0 h-full w-[21%] rounded-md bg-neutral-800" />
                <div className="absolute left-2 flex items-center gap-1.5 text-sm text-neutral-100">
                  <RotateCcwSquare className="mt-1" />
                  <p>reddit.com</p>
                </div>
                <p className="absolute right-2 text-sm text-neutral-300">7%</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-5 w-full bg-linear-to-t from-neutral-950 to-transparent" />
      </div>
      {/*insight card */}
      <div className="px-4 pb-4">
        <div className="text-sm font-semibold text-white">Visitor Insights</div>
        <div className="mt-2 text-xs text-neutral-400">
          Track where your visitors come from with real-time data on referrers,
          countries, devices, browsers, and operating systems.
        </div>
      </div>
    </div>
  );
};

export default FeatureInsights;
