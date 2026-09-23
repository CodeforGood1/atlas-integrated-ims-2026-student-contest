import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = "Loading data..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="w-8 h-8 text-copper-500 animate-spin mb-3" strokeWidth={2} />
      <p className="text-[14px] text-warm-600 font-medium">{message}</p>
    </div>
  );
}
