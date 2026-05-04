"use client";

import { ClubVizLogo } from "@/components/auth/logo";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BatteryFull, ChevronUp, Signal, Wifi } from "lucide-react";

const statusIndicators = [
    { id: "signal", icon: Signal },
    { id: "wifi", icon: Wifi },
    { id: "battery", icon: BatteryFull },
];

export default function IntroScreen() {
    const router = useRouter();
    const arrowRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);

    // Auto-redirect to mobile verification after 3 seconds
    useEffect(() => {
        const t = setTimeout(() => {
            router.push('/bz/auth/mobile');
        }, 3000);

        return () => clearTimeout(t);
    }, [router]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartY(e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const dragDistance = dragStartY - e.clientY;
        // If user drags up by at least 30px, navigate to mobile verification
        if (dragDistance > 30) {
            router.push('/bz/auth/mobile');
            setIsDragging(false);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleGuestLogin = () => {
        router.push("/bz/business");
    };

    const handleMobileLogin = () => {
        router.push("/bz/auth/mobile");
    };

    const handleMobileVerification = () => {
        router.push("/bz/auth/mobile");
    };

    const handleGoogleLogin = () => {
        // Handle Google login
        console.log("Google login");
    };

    const handleRegister = () => {
        router.push("/bz/auth/register");
    };

    const handleLogin = () => {
        router.push("/bz/auth/login");
    };

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#031313] text-white">
            <div className="pointer-events-none absolute inset-0">
                {/* Main disco ball background */}
                <div className="absolute inset-0 scale-[1.05] bg-[url('/disco-ball-bg.gif')] bg-cover bg-center opacity-90" />

                {/* Blur overlay for the background */}
                <div className="absolute inset-0 backdrop-blur-[4px] bg-[#031313]/20" />

                {/* Overlay gradient to enhance contrast for text */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(3,19,19,0.1),rgba(3,19,19,0.3)_35%,rgba(3,19,19,0.75)_80%,rgba(3,19,19,0.95)_100%)] opacity-80" />

                {/* Additional floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-[10%] left-[5%] h-[7rem] w-[7rem] rounded-full bg-[#14FFEC]/20 blur-[1.5625rem] animate-pulse" style={{ animationDuration: '7s' }} />
                    <div className="absolute top-[25%] left-[85%] h-[8rem] w-[8rem] rounded-full bg-[#14FFEC]/15 blur-[1.875rem] animate-pulse" style={{ animationDuration: '9s' }} />
                    <div className="absolute top-[65%] left-[15%] h-[9rem] w-[9rem] rounded-full bg-[#14FFEC]/10 blur-[2.1875rem] animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute top-[40%] left-[75%] h-[6rem] w-[6rem] rounded-full bg-[#14FFEC]/25 blur-[1.25rem] animate-pulse" style={{ animationDuration: '10s' }} />
                    <div className="absolute top-[80%] left-[60%] h-[7rem] w-[7rem] rounded-full bg-[#14FFEC]/20 blur-[1.5625rem] animate-pulse" style={{ animationDuration: '7.5s' }} />
                </div>

                {/* Main focal glow in center */}
                <div className="absolute top-[40%] left-1/2 h-[31.25rem] w-[31.25rem] -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(20,255,236,0.25)_0%,rgba(3,19,19,0.05)_48%,rgba(3,19,19,0)_100%)] blur-[2.5rem] opacity-90" />
                </div>

                {/* Extra ambient light sources */}
                <div className="absolute -left-[1rem] top-1/4 h-[18rem] w-[18rem] bg-teal-500/15 blur-[8.75rem]" />
                <div className="absolute bottom-1/3 right-0 h-[15rem] w-[15rem] bg-cyan-500/10 blur-[7.5rem]" />

                {/* Bottom curve with exact radial gradient from design */}
                <div className="absolute bottom-0 left-0 right-0 h-[6.25rem] overflow-hidden">
                    <div className="absolute bottom-0 left-1/2 w-[53.875rem] h-[53.875rem] -translate-x-1/2 translate-y-[92%]">
                        <div
                            className="w-full h-full rounded-[53.875rem]"
                            style={{
                                background: "radial-gradient(38.77% 38.77% at 115.84% 50%, #14FFEC 0%, #003336 88.46%)"
                            }}
                        />
                        {/* Up arrow icon */}
                        <div
                            ref={arrowRef}
                            className="absolute left-1/2 top-[2%] -translate-x-1/2 flex h-[2rem] w-[2rem] items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 select-none"
                            onClick={handleMobileVerification}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <ChevronUp
                                className="h-[1.5rem] w-[1.5rem] text-[#ffffff]"
                                strokeWidth={3}
                            />
                        </div>
                    </div>
                </div>
            </div>



            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-[1.5rem] pb-[7rem] pt-[2.5rem]">
                <div className="mb-[4rem] drop-shadow-[0_1.125rem_2.8125rem_rgba(0,0,0,0.55)]">
                    <ClubVizLogo size="lg" variant="full" />
                </div>

                <div className="relative text-center mt-[3rem]">
                    {/* Opening Double Quotes SVG */}
                    <div className="absolute -left-[3.5rem] -top-[2rem] flex space-x-[0.5rem]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="32"
                            viewBox="0 0 18 31"
                            fill="none"
                            style={{
                                filter: "drop-shadow(0 0 15px rgba(80,204,218,0.5))"
                            }}
                        >
                            <path
                                d="M17.051 30.9076L0.0531366 30.8768L0.0839613 13.8619L6.9249 0.241743L15.3982 0.257094L8.59145 13.8773L17.0819 13.8927L17.051 30.9076Z"
                                fill="#50CCDA"
                            />
                        </svg>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="32"
                            viewBox="0 0 18 31"
                            fill="none"
                            style={{
                                filter: "drop-shadow(0 0 15px rgba(0,134,125,0.5))"
                            }}
                        >
                            <path
                                d="M17.051 30.9076L0.0531366 30.8768L0.0839613 13.8619L6.9249 0.241743L15.3982 0.257094L8.59145 13.8773L17.0819 13.8927L17.051 30.9076Z"
                                fill="#00867D"
                            />
                        </svg>
                    </div>
                    <h2
                        className="text-center font-['Anton_SC',system-ui] text-[2.25rem] leading-[2.3125rem] tracking-[-0.02rem] mt-[1.5rem]"
                        style={{
                            background: "linear-gradient(180deg, #7FF9FF 0%, #FFF 102.94%)",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            WebkitTextStrokeWidth: "0.0625rem",
                            WebkitTextStrokeColor: "#029694",
                            fontWeight: 700,
                            fontStyle: "normal",
                            textShadow: "0 0 0.625rem rgba(127, 249, 255, 0.5)"
                        }}
                    >
                        IGNITE
                        <br />
                        THE <span style={{ fontWeight: 900 }}>NIGHT</span>
                    </h2>
                    {/* Closing Double Quotes SVG */}
                    <div className="absolute -bottom-[2.5rem] -right-[3.5rem] flex space-x-[0.5rem]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="32"
                            viewBox="0 0 18 31"
                            fill="none"
                            style={{
                                filter: "drop-shadow(0 0 15px rgba(80,204,218,0.5))"
                            }}
                        >
                            <path
                                d="M0.958374 0.125H17.9563V17.14L11.14 30.7725H2.66671L9.44879 17.14H0.958374V0.125Z"
                                fill="#50CCDA"
                            />
                        </svg>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="32"
                            viewBox="0 0 18 31"
                            fill="none"
                            style={{
                                filter: "drop-shadow(0 0 15px rgba(0,134,125,0.5))"
                            }}
                        >
                            <path
                                d="M0.958374 0.125H17.9563V17.14L11.14 30.7725H2.66671L9.44879 17.14H0.958374V0.125Z"
                                fill="#00867D"
                            />
                        </svg>
                    </div>
                </div>
            </div>

        </div>
    );
}