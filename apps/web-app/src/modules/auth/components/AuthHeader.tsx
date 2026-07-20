import Image from "next/image";

type AuthHeaderProps = {
  title: string;
  description: string;
};

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="mb-6 text-center">
      {/* Direct Logo Display */}
      <div className="mx-auto mb-3 flex items-center justify-center">
        <Image
          src="/assets/logo.png"
          alt="OTT Edu Logo"
          width={64}
          height={64}
          className="h-16 w-16 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
          priority
        />
      </div>

      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-indigo-600">OTT Edu</p>
      <div className="mx-auto mb-3 h-px w-16 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
