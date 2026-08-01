'use client';

export function AuthBackground() {
    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* 1. Main disco ball background */}
            <div className="absolute inset-0 scale-[1.05] bg-[url('/disco-ball-bg.gif')] bg-cover bg-center opacity-[0.85]" />

            {/* 2. Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-[6px] bg-[#031313]/40" />

            {/* 3. Radial gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(3,19,19,0.1),rgba(3,19,19,0.4)_35%,rgba(3,19,19,0.85)_80%,rgba(3,19,19,0.98)_100%)] opacity-90" />

            {/* 4. Floating particles/glows */}
            <div className="absolute inset-0 overflow-hidden">
                <div 
                    className="absolute -top-[10%] left-[5%] h-[15rem] w-[15rem] rounded-full bg-[#14FFEC]/10 blur-[4rem] animate-pulse" 
                    style={{ animationDuration: '7s' }} 
                />
                <div 
                    className="absolute top-[60%] right-[-10%] h-[20rem] w-[20rem] rounded-full bg-[#00867D]/10 blur-[5rem] animate-pulse" 
                    style={{ animationDuration: '9s' }} 
                />
            </div>
        </div>
    );
}
