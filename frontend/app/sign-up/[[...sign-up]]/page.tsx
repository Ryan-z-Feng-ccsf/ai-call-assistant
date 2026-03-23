"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-root { min-height: 100vh; display: flex; position: relative; font-family: 'Inter', sans-serif; overflow: hidden; }
        .auth-bg { position: fixed; inset: 0; background-image: url('/auth-bg.png'); background-size: cover; background-position: center; filter: brightness(0.7) saturate(1.3); z-index: 0; }
        .auth-flow { position: fixed; inset: 0; z-index: 1; background: linear-gradient(125deg, rgba(0,220,210,0.08) 0%, rgba(0,40,60,0.45) 35%, rgba(0,0,0,0.3) 60%, rgba(0,180,180,0.06) 100%); background-size: 300% 300%; animation: flowBg 8s ease-in-out infinite alternate; }
        @keyframes flowBg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .auth-scanlines { position: fixed; inset: 0; z-index: 2; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,220,210,0.012) 2px, rgba(0,220,210,0.012) 4px); pointer-events: none; }
        .auth-left { flex: 1; position: relative; z-index: 3; display: flex; flex-direction: column; justify-content: flex-end; padding: 48px; }
        .auth-corner { position: fixed; top: 32px; left: 32px; z-index: 10; }
        .auth-logo-text { font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.1em; }
        .auth-logo-sub { font-size: 10px; color: #00ddd0; letter-spacing: 0.2em; margin-top: 2px; }
        .auth-phase { font-family: 'Orbitron', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #00ddd0; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .auth-phase::before { content: ''; width: 32px; height: 1px; background: #00ddd0; box-shadow: 0 0 8px #00ddd0; }
        .auth-headline { font-family: 'Orbitron', monospace; font-size: 38px; font-weight: 900; line-height: 1.1; color: #fff; margin-bottom: 20px; text-shadow: 0 0 40px rgba(0,220,210,0.3); }
        .auth-headline span { color: #00ddd0; text-shadow: 0 0 20px #00ddd0, 0 0 40px rgba(0,220,210,0.5); }
        .auth-desc { font-size: 15px; font-weight: 300; line-height: 1.7; color: rgba(255,255,255,0.65); max-width: 420px; margin-bottom: 40px; }
        .auth-features { display: flex; flex-direction: column; gap: 10px; }
        .auth-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.55); }
        .auth-feature-dot { width: 6px; height: 6px; border-radius: 50%; background: #00ddd0; box-shadow: 0 0 8px #00ddd0; flex-shrink: 0; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 6px #00ddd0; } 50% { box-shadow: 0 0 14px #00ddd0, 0 0 24px rgba(0,220,210,0.4); } }
        .auth-right { width: 460px; flex-shrink: 0; position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 40px; }
        .auth-right::before { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(0,220,210,0.08) 0%, rgba(0,8,16,0.82) 40%, rgba(0,180,160,0.06) 70%, rgba(0,3,10,0.88) 100%); background-size: 200% 200%; animation: glassFlow 6s ease-in-out infinite alternate; backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-left: 1px solid rgba(0,220,210,0.18); }
        @keyframes glassFlow { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .auth-right::after { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, transparent 0%, #00ddd0 25%, rgba(0,220,210,0.5) 50%, #00ddd0 75%, transparent 100%); box-shadow: 0 0 12px #00ddd0; animation: shimmer 4s ease-in-out infinite alternate; }
        @keyframes shimmer { 0% { opacity: 0.5; } 100% { opacity: 1; } }
        .auth-right-inner { position: relative; z-index: 1; width: 100%; }
        .auth-right-header { text-align: center; margin-bottom: 32px; }
        .auth-right-title { font-family: 'Orbitron', monospace; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 0.08em; margin-bottom: 6px; }
        .auth-right-sub { font-size: 13px; color: rgba(255,255,255,0.85); }
        .cl-rootBox { width: 100%; }
        .cl-card { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .cl-headerTitle, .cl-headerSubtitle { display: none !important; }
        .cl-formFieldInput::placeholder { color: rgba(255,255,255,0.4) !important; }
        .cl-formFieldInput { background: rgba(0,15,25,0.75) !important; border: 1px solid rgba(0,220,210,0.25) !important; color: #fff !important; border-radius: 8px !important; backdrop-filter: blur(8px) !important; }
        .cl-formFieldInput:focus { border-color: #00ddd0 !important; box-shadow: 0 0 0 2px rgba(0,220,210,0.2), 0 0 16px rgba(0,220,210,0.15) !important; }
        .cl-formFieldLabel {
          color: #ffffff !important; color: #ffffff !important; font-size: 12px !important; letter-spacing: 0.06em !important; }
        .cl-formButtonPrimary { background: linear-gradient(135deg, rgba(0,180,170,0.9), rgba(0,130,150,0.9)) !important; border: 1px solid rgba(0,220,210,0.4) !important; font-family: 'Orbitron', monospace !important; font-size: 11px !important; letter-spacing: 0.12em !important; border-radius: 8px !important; box-shadow: 0 4px 20px rgba(0,180,180,0.25) !important; transition: all 0.25s !important; }
        .cl-formButtonPrimary:hover { box-shadow: 0 4px 32px rgba(0,220,210,0.5) !important; transform: translateY(-1px) !important; }
        .cl-footerActionLink { color: #00ddd0 !important; }
        .cl-footerAction { color: rgba(255,255,255,0.35) !important; }
        .cl-badge { position: absolute !important; top: 50% !important; right: 16px !important; transform: translateY(-50%) !important; margin-left: 0 !important; }
        .cl-socialButtonsBlockButton { background: rgba(0,20,30,0.45) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #ffffff !important; border-radius: 8px !important; backdrop-filter: blur(8px) !important; transition: all 0.2s !important; font-weight: 500 !important; }
        .cl-socialButtonsBlockButton:hover { background: rgba(0,40,50,0.6) !important; border-color: rgba(0,220,210,0.35) !important; }
        .cl-dividerLine { background: rgba(0,220,210,0.15) !important; }
        .cl-dividerText { color: rgba(255,255,255,0.3) !important; }
        
        
        .cl-footer { background: transparent !important; }
        .cl-footerPages { background: transparent !important; }
        .cl-footerPagesLink { color: rgba(255,255,255,0.8) !important; }
        .cl-card__footer { background: transparent !important; border-top: 1px solid rgba(0,220,210,0.1) !important; }
        [data-localization-key="footerActionLink__signUp"] { color: #00ddd0 !important; }
        [data-localization-key="footerActionLink__signIn"] { color: #00ddd0 !important; }
        .cl-footerAction__signUp, .cl-footerAction__signIn { 
          background: transparent !important; 
          color: rgba(255,255,255,0.8) !important;
        }
        /* Kill the dark blue footer bar */
        .cl-card > div:last-child { background: transparent !important; }
        div[class*="cl-"][style*="background"] { background: transparent !important; }
        
        
        .cl-lastAuthenticationStrategyBadge {
          position: absolute !important;
          top: 50% !important;
          right: 14px !important;
          left: auto !important;
          transform: translateY(-50%) !important;
          background: rgba(0,220,210,0.15) !important;
          color: #00ddd0 !important;
          border: 1px solid rgba(0,220,210,0.3) !important;
          font-size: 10px !important;
          border-radius: 4px !important;
          padding: 2px 6px !important;
        }
        .cl-socialButtonsBlockButton {
          position: relative !important;
        }
        
        /* Force all text white */
        .cl-internal-b3fm57, .cl-formHeaderTitle, .cl-formHeaderSubtitle,
        .cl-socialButtonsBlockButtonText, .cl-formFieldInputShowPasswordButton,
        .cl-otpCodeFieldInput, .cl-alternativeMethodsBlockButton { color: #ffffff !important; }
        .cl-badge { 
          background: rgba(0,220,210,0.2) !important; 
          color: #00ddd0 !important; 
          border: 1px solid rgba(0,220,210,0.3) !important;
          font-size: 10px !important;
          border-radius: 4px !important;
        }
        .cl-userButtonPopoverActionButtonText { color: #ffffff !important; }
        
        @media (max-width: 900px) { .auth-left { display: none; } .auth-right { width: 100%; } .auth-right::before { border-left: none; } }
      `}</style>

      <div className="auth-root">
        <div className="auth-bg" />
        <div className="auth-flow" />
        <div className="auth-scanlines" />

        <div className="auth-left">
          <div className="auth-corner">
            <div className="auth-logo-text">AI CALL</div>
            <div className="auth-logo-sub">ASSISTANT</div>
          </div>
          <div className="auth-phase">Phase 01 · Integration</div>
          <div className="auth-headline">
            Your voice,<br />
            <span>unlimited</span>
          </div>
          <p className="auth-desc">
            Join thousands breaking language barriers in real-time.
            Sign up in seconds — no credit card required.
          </p>
          <div className="auth-features">
            {["Free to start — no credit card needed", "Real-time speech transcription", "14 language translation pairs", "Session history & export"].map((f, i) => (
              <div key={f} className="auth-feature">
                <span className="auth-feature-dot" style={{ animationDelay: `${i * 0.4}s` }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-right-inner">
            <div className="auth-right-header">
              <div className="auth-right-title">CREATE ACCOUNT</div>
              <div className="auth-right-sub">Start breaking barriers</div>
            </div>
            <SignUp
              appearance={{
                variables: {
                  colorBackground: "transparent",
                  colorText: "#ffffff",
                  colorPrimary: "#00ddd0",
                  colorInputBackground: "rgba(0,15,25,0.75)",
                  colorInputText: "#ffffff",
                  borderRadius: "8px",
                },
              }}
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
            />
          </div>
        </div>
      </div>
    </>
  );
}