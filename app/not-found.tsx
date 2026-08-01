import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NotFound() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#02090E] text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-[#031017] via-[#03171F] to-[#011016]" />
            <div className="absolute inset-0">
                <div className="absolute -top-[25%] left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#12FFE8_0%,rgba(3,23,27,0.05)_60%,rgba(3,23,27,0)_100%)] blur-[140px]" />
                <div className="absolute -bottom-[30%] right-[10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,#0CF1D4_0%,rgba(3,23,27,0.08)_55%,rgba(3,23,27,0)_100%)] blur-[160px]" />
            </div>

            <div className="relative flex w-full max-w-sm flex-col gap-10 px-6 pb-12 pt-12 text-center">
                <header className="flex items-center justify-start text-white/70">
                    <Link
                        href="/"
                        aria-label="Go back"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.6} />
                    </Link>
                </header>

                <div className="relative flex flex-col items-center">
                    <span
                        aria-hidden="true"
                        className="text-neon-404 pointer-events-none select-none text-[168px] leading-none tracking-normal text-center"
                    >
                        404
                    </span>
                    <div className="relative z-10 -mt-[192px] w-full max-w-[240px]">
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(18,255,232,0.2)_0%,rgba(18,255,232,0.08)_36%,rgba(3,10,12,0)_80%)]" />
                        <Image
                            src="/404/clubwiz-404.png"
                            alt="ClubWiz lost bottle illustration"
                            width={480}
                            height={900}
                            priority
                            className="relative mx-auto h-auto w-full max-w-[240px] object-contain drop-shadow-[0_30px_60px_rgba(9,234,211,0.35)]"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                    {/* <p className="text-sm uppercase tracking-[0.6em] text-white/40">Error Message Here</p> */}
                    <h2 className="text-lg font-semibold tracking-[0.58em] text-white">
                        Page Not Found
                    </h2>
                    <p className="max-w-[280px] text-sm leading-relaxed text-white/60">
                        Looks like the vibe you were searching for slipped through the cracks. Let’s get you back on the guest list.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em]">
                    <Link
                        href="/"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#12FFE8]/10 px-6 py-3 text-white transition hover:bg-[#12FFE8]/20"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
