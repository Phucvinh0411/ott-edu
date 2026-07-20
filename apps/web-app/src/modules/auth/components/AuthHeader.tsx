import Image from "next/image";

type AuthHeaderProps = {
  title: string;
  description: string;
};

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="mb-6 text-center">
      {/* Modern Premium Logo Display */}
      <div className="relative mx-auto mb-4 inline-flex items-center justify-center">
        {/* Soft Ambient Glow backdrop */}
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/15 blur-lg" />
        
        {/* Logo Container Box */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100/80 bg-white p-3 shadow-md shadow-indigo-500/10 transition-transform duration-300 hover:scale-105">
          <Image
            src="/assets/logo.png"
            alt="OTT Edu Logo"
            width={48}
            height={48}
            className="h-full w-full object-contain drop-shadow-sm"
            priority
          />
        </div>
      </div>

      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-indigo-600">OTT Edu</p>
      <div className="mx-auto mb-3 h-px w-16 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
