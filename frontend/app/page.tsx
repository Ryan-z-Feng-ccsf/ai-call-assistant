"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { Flag } from "@/components/Flag";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LANGUAGES, SCENARIOS } from "@/lib/constants";

// Uses flag-icons CSS library — no image requests, works on all platforms including Windows

type LangPickerSide = "source" | "target" | null;

export default function CallAssistant() {
  const { getToken, userId } = useAuth();

  const [isRecording, setIsRecording] = useState(false);
  const [scenario, setScenario] = useState("General Professional Call");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Chinese (中文)");
  const [showScenarioPicker, setShowScenarioPicker] = useState(false);
  const [openLangPicker, setOpenLangPicker] = useState<LangPickerSide>(null);
  const [isAIListening, setIsAIListening] = useState(true);
  const isAIListeningRef = useRef(true);

  const scenarioPickerRef = useRef<HTMLDivElement>(null);
  const langPickerRef = useRef<HTMLDivElement>(null);

  const [transcript, setTranscript] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>("Waiting for audio to summarize...");
  const [translation, setTranslation] = useState<string>("Waiting for audio to translate...");
  const [replies, setReplies] = useState<string[]>(["...", "...", "..."]);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const sourceLangObj = LANGUAGES.find(l => l.value === sourceLang)!;
  const targetLangObj = LANGUAGES.find(l => l.value === targetLang)!;
  const currentScenario = SCENARIOS.find(s => s.value === scenario)!;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (scenarioPickerRef.current && !scenarioPickerRef.current.contains(e.target as Node)) setShowScenarioPicker(false);
      if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) setOpenLangPicker(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const swapLanguages = () => { if (isRecording) return; setSourceLang(targetLang); setTargetLang(sourceLang); };
  const toggleAIListening = () => { setIsAIListening(p => { isAIListeningRef.current = !p; return !p; }); };

  const handleReplyClick = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const utterance = new SpeechSynthesisUtterance(lines.length > 1 ? lines[lines.length - 1] : text);
      utterance.rate = 0.9;
      utterance.onstart = () => { setIsAIListening(false); isAIListeningRef.current = false; };
      utterance.onend = () => { setIsAIListening(true); isAIListeningRef.current = true; };
      window.speechSynthesis.speak(utterance);
    }
  };

  const startCall = async () => {
    try {
      setTranscript([]);
      const token = await getToken();
      const params = new URLSearchParams({ scenario, source_language: sourceLang, target_language: targetLang, token: token ?? "" });
      socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_API_URL!.replace('http', 'ws')}/ws/audio?${params}`);
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.transcript) setTranscript(prev => [...prev, data.transcript]);
        if (data.summary) setSummary(data.summary);
        if (data.translation) setTranslation(data.translation);
        if (data.replies) setReplies(data.replies);
      };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN && isAIListeningRef.current)
          socketRef.current.send(event.data);
      };
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (error) { console.error("Setup error:", error); }
  };

  const stopCall = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    socketRef.current?.close();
    setIsRecording(false);
  };

  return (
    <>
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/6.6.6/css/flag-icons.min.css');
        /* ── Theme Variables ── */
        :root, html[data-theme="dark"] {
          --bg-page:           #0f0f11;
          --bg-glass:          rgba(20,20,24,0.7);
          --bg-glass-strong:   rgba(255,255,255,0.06);
          --bg-control:        rgba(255,255,255,0.07);
          --bg-control-hover:  rgba(255,255,255,0.12);
          --bg-popover:        rgba(22,22,26,0.92);
          --bg-option-hover:   rgba(99,102,241,0.1);
          --bg-option-active:  rgba(99,102,241,0.18);
          --bg-transcript:     rgba(255,255,255,0.02);
          --bg-reply:          rgba(255,255,255,0.06);
          --bg-reply-hover:    rgba(255,255,255,0.1);
          --border-glass:      rgba(255,255,255,0.1);
          --border-subtle:     rgba(255,255,255,0.06);
          --border-option:     rgba(255,255,255,0.05);
          --text-primary:      #f4f4f5;
          --text-secondary:    #a1a1aa;
          --text-muted:        #71717a;
          --text-faint:        #52525b;
          --accent:            #6366f1;
          --accent-text:       #a5b4fc;
          --summary-bg:        linear-gradient(145deg, rgba(30,30,40,0.8) 0%, rgba(40,40,60,0.6) 100%);
          --summary-border:    rgba(255,255,255,0.08);
          --translation-color: #818cf8;
          --section-label:     #a5b4fc;
          --dot-idle:          #52525b;
          --dot-active:        #ff3b30;
          --gradient-bg:       linear-gradient(135deg, #0d0d14 0%, #0f0a1a 30%, #130a18 60%, #0a0f14 100%);
          --orb-a:             rgba(99,102,241,0.15);
          --orb-b:             rgba(168,85,247,0.1);
          --reply-top-color:   #e4e4e7;
          --reply-bot-color:   #71717a;
          --swap-border-l:     rgba(255,255,255,0.06);
          --swap-border-r:     rgba(255,255,255,0.06);
          --swap-bg:           rgba(255,255,255,0.04);
          --swap-bg-hover:     rgba(99,102,241,0.12);
        }

        html[data-theme="light"] {
          --bg-page:           #f0f0f3;
          --bg-glass:          rgba(255,255,255,0.72);
          --bg-glass-strong:   rgba(255,255,255,0.85);
          --bg-control:        rgba(255,255,255,0.8);
          --bg-control-hover:  rgba(255,255,255,0.98);
          --bg-popover:        rgba(255,255,255,0.96);
          --bg-option-hover:   rgba(79,70,229,0.07);
          --bg-option-active:  rgba(79,70,229,0.12);
          --bg-transcript:     rgba(0,0,0,0.02);
          --bg-reply:          rgba(255,255,255,0.7);
          --bg-reply-hover:    rgba(255,255,255,0.95);
          --border-glass:      rgba(0,0,0,0.08);
          --border-subtle:     rgba(0,0,0,0.05);
          --border-option:     rgba(0,0,0,0.04);
          --text-primary:      #111113;
          --text-secondary:    #3f3f46;
          --text-muted:        #71717a;
          --text-faint:        #a1a1aa;
          --accent:            #4f46e5;
          --accent-text:       #4f46e5;
          --summary-bg:        linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(238,240,255,0.7) 100%);
          --summary-border:    rgba(0,0,0,0.07);
          --translation-color: #4338ca;
          --section-label:     #6366f1;
          --dot-idle:          #d4d4d8;
          --dot-active:        #ef4444;
          --gradient-bg:       linear-gradient(135deg, #eef0f8 0%, #f3eeff 30%, #fce8f4 60%, #e8f4fc 100%);
          --orb-a:             rgba(99,102,241,0.1);
          --orb-b:             rgba(168,85,247,0.07);
          --reply-top-color:   #18181b;
          --reply-bot-color:   #71717a;
          --swap-border-l:     rgba(0,0,0,0.06);
          --swap-border-r:     rgba(0,0,0,0.06);
          --swap-bg:           rgba(255,255,255,0.5);
          --swap-bg-hover:     rgba(79,70,229,0.08);
        }


        html[data-theme="cyber"] {
          --bg-page:           #000d10;
          --bg-glass:          rgba(0,20,28,0.75);
          --bg-glass-strong:   rgba(0,220,210,0.06);
          --bg-control:        rgba(0,220,210,0.07);
          --bg-control-hover:  rgba(0,220,210,0.14);
          --bg-popover:        rgba(0,12,18,0.95);
          --bg-option-hover:   rgba(0,220,210,0.08);
          --bg-option-active:  rgba(0,220,210,0.15);
          --bg-transcript:     rgba(0,220,210,0.02);
          --bg-reply:          rgba(0,220,210,0.05);
          --bg-reply-hover:    rgba(0,220,210,0.1);
          --border-glass:      rgba(0,220,210,0.18);
          --border-subtle:     rgba(0,220,210,0.1);
          --border-option:     rgba(0,220,210,0.08);
          --text-primary:      #e0fffe;
          --text-secondary:    #7ececa;
          --text-muted:        #4a9a9a;
          --text-faint:        #2d6a6a;
          --accent:            #00ddd0;
          --accent-text:       #00ddd0;
          --summary-bg:        linear-gradient(145deg, rgba(0,20,28,0.9) 0%, rgba(0,40,50,0.7) 100%);
          --summary-border:    rgba(0,220,210,0.15);
          --translation-color: #00ddd0;
          --section-label:     #00ddd0;
          --dot-idle:          #2d6a6a;
          --dot-active:        #00ddd0;
          --gradient-bg:       linear-gradient(135deg, #000d10 0%, #001a1f 30%, #000f14 60%, #001015 100%);
          --orb-a:             rgba(0,220,210,0.12);
          --orb-b:             rgba(0,180,170,0.08);
          --reply-top-color:   #e0fffe;
          --reply-bot-color:   #4a9a9a;
          --swap-border-l:     rgba(0,220,210,0.1);
          --swap-border-r:     rgba(0,220,210,0.1);
          --swap-bg:           rgba(0,220,210,0.04);
          --swap-bg-hover:     rgba(0,220,210,0.12);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          transition: background 0.3s;
        }

        .app-bg {
          min-height: 100vh;
          background: var(--gradient-bg);
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          padding: 24px; position: relative; overflow-x: hidden;
        }
        .app-bg::before {
          content: ''; position: fixed; top: -20%; left: -10%;
          width: 60vw; height: 60vw; border-radius: 50%;
          background: radial-gradient(circle, var(--orb-a) 0%, transparent 70%);
          pointer-events: none; animation: orb1 20s ease-in-out infinite alternate;
        }
        .app-bg::after {
          content: ''; position: fixed; bottom: -20%; right: -10%;
          width: 50vw; height: 50vw; border-radius: 50%;
          background: radial-gradient(circle, var(--orb-b) 0%, transparent 70%);
          pointer-events: none; animation: orb2 25s ease-in-out infinite alternate;
        }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes orb1 { from{transform:translate(0,0) scale(1)} to{transform:translate(5vw,5vh) scale(1.1)} }
        @keyframes orb2 { from{transform:translate(0,0) scale(1)} to{transform:translate(-5vw,-5vh) scale(1.15)} }

        .glass {
          background: var(--bg-glass);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        /* ── Header ── */
        .header {
          max-width: 1100px; margin: 0 auto 24px;
          padding: 18px 24px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 14px; position: relative; z-index: 20;
        }
        .app-title {
          font-size: 26px; font-weight: 700; letter-spacing: -0.5px;
          color: var(--text-primary);
        }
        .history-link {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 6px;
          padding: 5px 10px 5px 8px;
          background: var(--bg-control); border: 1px solid var(--border-subtle);
          border-radius: 20px; font-size: 12px; font-weight: 500; color: var(--text-muted);
          text-decoration: none; transition: all 0.2s;
        }
        .history-link:hover { background: var(--bg-control-hover); color: var(--accent); }
        .history-link-dot { width: 6px; height: 6px; border-radius: 50%; background: #34c759; box-shadow: 0 0 0 2px rgba(52,199,89,0.25); flex-shrink: 0; }

        .controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        /* ── Theme button ── */
        .btn-theme {
          width: 36px; height: 36px; border-radius: 11px;
          border: 1px solid var(--border-glass);
          background: var(--bg-control);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 16px;
          transition: all 0.2s; flex-shrink: 0;
        }
        .btn-theme:hover { background: var(--bg-control-hover); }

        /* ── Scenario Picker ── */
        .scenario-wrap { position: relative; }
        .picker-trigger {
          display: flex; align-items: center; gap: 10px; padding: 9px 14px;
          background: var(--bg-control);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass); border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .picker-trigger:hover { background: var(--bg-control-hover); }
        .picker-trigger:disabled { opacity: 0.5; cursor: not-allowed; }
        .trigger-icon { font-size: 18px; }
        .trigger-text { display: flex; flex-direction: column; align-items: flex-start; }
        .trigger-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-faint); }
        .trigger-value { font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
        .chevron { color: var(--text-faint); transition: transform 0.22s; margin-left: 4px; }
        .chevron.open { transform: rotate(180deg); }

        .picker-popover {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 200;
          background: var(--bg-popover);
          backdrop-filter: blur(28px) saturate(200%); -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid var(--border-glass); border-radius: 18px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
          padding: 8px; min-width: 268px;
          animation: popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        .picker-option {
          display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px;
          border: none; border-radius: 12px; background: transparent; cursor: pointer;
          font-family: inherit; transition: background 0.15s; text-align: left;
        }
        .picker-option:hover { background: var(--bg-option-hover); }
        .picker-option.active { background: var(--bg-option-active); }
        .option-icon { font-size: 18px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-glass-strong); border-radius: 10px; border: 1px solid var(--border-option); flex-shrink: 0; }
        .option-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .option-check { margin-left: auto; color: var(--accent); opacity: 0; transition: opacity 0.15s; }
        .picker-option.active .option-check { opacity: 1; }

        /* ── Language Pair ── */
        .lang-pair-wrap { position: relative; }
        .lang-pair-pill {
          display: flex; align-items: center;
          background: var(--bg-control);
          backdrop-filter: blur(10px); border: 1px solid var(--border-glass);
          border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;
        }
        .lang-pill-btn {
          display: flex; align-items: center; gap: 7px; padding: 9px 14px;
          border: none; background: transparent; cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .lang-pill-btn:hover { background: var(--bg-option-hover); }
        .lang-pill-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .lang-flag { font-size: 18px; line-height: 1; }
        .lang-pill-text { display: flex; flex-direction: column; align-items: flex-start; }
        .lang-pill-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-faint); }
        .lang-pill-value { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
        .lang-swap-btn {
          width: 32px; display: flex; align-items: center; justify-content: center;
          border: none; border-left: 1px solid var(--swap-border-l); border-right: 1px solid var(--swap-border-r);
          background: var(--swap-bg); cursor: pointer; font-size: 16px;
          transition: background 0.15s; padding: 0; color: var(--text-muted);
          align-self: stretch;
        }
        .lang-swap-btn:hover { background: var(--swap-bg-hover); }
        .lang-swap-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .swap-icon { transition: transform 0.4s cubic-bezier(0.34,1.3,0.64,1); display: block; }
        .lang-swap-btn:hover .swap-icon { transform: rotate(180deg); }

        .lang-dropdown {
          position: absolute; top: calc(100% + 8px); z-index: 200;
          background: var(--bg-popover);
          backdrop-filter: blur(28px) saturate(200%); -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid var(--border-glass); border-radius: 18px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2); padding: 8px; min-width: 200px;
          animation: popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lang-dropdown.source { left: 0; }
        .lang-dropdown.target { right: 0; }
        .option-flag { font-size: 18px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-glass-strong); border-radius: 8px; border: 1px solid var(--border-option); flex-shrink: 0; }

        /* ── Buttons ── */
        .btn-ai-toggle {
          padding: 9px 16px; border-radius: 12px; border: 1px solid;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.25s; backdrop-filter: blur(10px);
        }
        .btn-ai-listening { background: rgba(52,199,89,0.15); border-color: rgba(52,199,89,0.35); color: #34c759; }
        .btn-ai-paused    { background: rgba(255,149,0,0.15);  border-color: rgba(255,149,0,0.35);  color: #ff9500; }
        .btn-main {
          padding: 11px 24px; border-radius: 14px; border: none;
          font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); letter-spacing: -0.2px;
        }
        .btn-start { background: linear-gradient(135deg, var(--accent), #0077ed); color: white; box-shadow: 0 4px 16px rgba(99,102,241,0.35); }
        .btn-start:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }
        .btn-stop  { background: linear-gradient(135deg,#ff3b30,#ff453a); color: white; box-shadow: 0 4px 16px rgba(255,59,48,0.35); animation: pulse-red 2s ease-in-out infinite; }
        @keyframes pulse-red { 0%,100%{box-shadow:0 4px 16px rgba(255,59,48,0.35)} 50%{box-shadow:0 4px 28px rgba(255,59,48,0.6)} }

        /* ── Layout ── */
        .main-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; position: relative; z-index: 10; }
        @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

        /* ── Transcript Panel ── */
        .transcript-panel { height: 600px; display: flex; flex-direction: column; overflow: hidden; }
        .panel-header {
          padding: 16px 20px; border-bottom: 1px solid var(--border-subtle);
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-glass-strong); border-radius: 20px 20px 0 0;
        }
        .recording-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dot-idle); transition: background 0.3s; }
        .recording-dot.active { background: var(--dot-active); animation: blink 1.2s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .panel-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-faint); }
        .transcript-body { flex: 1; overflow-y: auto; padding: 20px; scroll-behavior: smooth; }
        .transcript-body::-webkit-scrollbar { width: 4px; }
        .transcript-body::-webkit-scrollbar-thumb { background: var(--border-glass); border-radius: 2px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: var(--text-faint); }
        .empty-icon { width: 48px; height: 48px; opacity: 0.25; }
        .empty-text { font-size: 14px; font-style: italic; color: var(--text-faint); }
        .transcript-line { display: flex; gap: 10px; margin-bottom: 16px; animation: fadeSlideIn 0.35s ease; }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .line-number { font-family: 'SF Mono','Monaco',monospace; font-size: 11px; color: var(--text-faint); margin-top: 3px; min-width: 28px; flex-shrink: 0; }
        .line-text { font-size: 15px; line-height: 1.55; color: var(--text-primary); letter-spacing: -0.1px; }

        /* ── Right Column ── */
        .right-col { display: flex; flex-direction: column; gap: 16px; }
        .summary-card {
          padding: 24px;
          background: var(--summary-bg);
          backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid var(--summary-border); border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }
        .summary-section { margin-bottom: 20px; }
        .summary-section:last-child { margin-bottom: 0; border-top: 1px solid var(--border-subtle); padding-top: 18px; }
        .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--section-label); margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
        .summary-text { font-size: 15px; font-weight: 500; color: var(--text-primary); line-height: 1.5; letter-spacing: -0.1px; }
        .translation-text { font-size: 15px; font-weight: 500; color: var(--translation-color); line-height: 1.5; }

        .replies-card { padding: 20px; flex: 1; }
        .reply-btn {
          width: 100%; text-align: left; padding: 16px 18px; margin-bottom: 10px;
          border-radius: 14px; border: 1px solid var(--border-subtle);
          background: var(--bg-reply);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          cursor: pointer; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.34,1.3,0.64,1);
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .reply-btn:last-child { margin-bottom: 0; }
        .reply-btn:hover { background: var(--bg-reply-hover); transform: scale(1.01) translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .reply-btn:active { transform: scale(0.99); }
        .reply-top    { font-size: 15px; font-weight: 600; color: var(--reply-top-color); margin-bottom: 2px; letter-spacing: -0.2px; }
        .reply-bottom { font-size: 13px; color: var(--reply-bot-color); font-weight: 400; }
        .speaker-icon { flex-shrink: 0; margin-left: 12px; color: var(--text-faint); opacity: 0; transition: color 0.2s, opacity 0.2s; }
        .reply-btn:hover .speaker-icon { opacity: 1; color: var(--accent); }

        /* ── UserButton Styling ── */
        .cl-userButtonTrigger {
          width: 36px !important; height: 36px !important;
          border-radius: 11px !important;
          border: 1px solid var(--border-glass) !important;
          background: var(--bg-control) !important;
          transition: all 0.2s !important;
        }
        .cl-userButtonTrigger:hover { background: var(--bg-control-hover) !important; }
        .cl-avatarBox { width: 28px !important; height: 28px !important; border-radius: 7px !important; }
        .cl-userButtonPopoverCard {
          background: var(--bg-popover) !important;
          border: 1px solid var(--border-glass) !important;
          border-radius: 16px !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3) !important;
          backdrop-filter: blur(24px) !important;
        }
        .cl-userButtonPopoverActionButton {
          color: var(--text-primary) !important;
          border-radius: 10px !important;
        }
        .cl-userButtonPopoverActionButton:hover { background: var(--bg-option-hover) !important; }
        .cl-userButtonPopoverActionButtonText { color: var(--text-primary) !important; }
        .cl-userButtonPopoverActionButtonIcon { color: var(--text-muted) !important; }
        .cl-userButtonPopoverFooter { display: none !important; }
        .cl-userPreviewMainIdentifier { color: var(--text-primary) !important; font-weight: 600 !important; }
        .cl-userPreviewSecondaryIdentifier { color: var(--text-muted) !important; }
        .cl-userButtonPopoverActionsSeparator { background: var(--border-subtle) !important; }

      `}</style>

      <div className="app-bg">
        <header className="header glass" style={{ flexDirection: "column", alignItems: "stretch", gap: "20px" }}>
          
          {/* 👆 第一层：标题区域 (左) 与 账号/主题控制区 (右) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="app-title">AI Call Assistant</div>
              <a href="/history" className="history-link">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="history-link-dot" />
                View History
              </a>
            </div>

            {/* 右上角：主题与登录 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ThemeToggle />

              {!userId ? (
                <SignInButton mode="modal">
                  <button className="btn-theme" style={{ width: "auto", padding: "0 14px", fontSize: "14px", fontWeight: 600 }}>
                    Sign In
                  </button>
                </SignInButton>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "36px" }}>
                  <UserButton 
  appearance={{
    
    variables: {
      // 全局变量绑定你的 CSS 变量
      colorPrimary: "var(--accent)",
      colorText: "var(--text-primary)",
      colorTextSecondary: "var(--text-muted)",
      colorBackground: "var(--bg-popover)",
    },
    elements: {
      // 强制面板背景和边框使用你的主题色
      userButtonPopoverCard: {
        backgroundColor: "var(--bg-popover)",
        backdropFilter: "blur(24px)",
        border: "1px solid var(--border-glass)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
      },
      // 名字颜色
      userPreviewMainIdentifier: {
        color: "var(--text-primary)",
        fontWeight: "600",
      },
      // 邮箱颜色
      userPreviewSecondaryIdentifier: {
        color: "var(--text-muted)",
      },
      // 菜单按钮文字（Manage account, Sign out）
      userButtonPopoverActionButtonText: {
        color: "var(--text-primary)",
      },
      // 菜单按钮图标
      userButtonPopoverActionButtonIcon: {
        color: "var(--text-muted)",
      },
      // 菜单悬浮效果
      userButtonPopoverActionButton: {
        "&:hover": {
          backgroundColor: "var(--bg-option-hover)",
        }
      }
    }
  }}
/>
                </div>
              )}
            </div>
          </div>

          {/* 👇 第二层：核心通话控制区 */}
          <div className="controls" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
            
            {/* Scenario Picker */}
            <div className="scenario-wrap" ref={scenarioPickerRef}>
              <button className="picker-trigger" disabled={isRecording} onClick={() => !isRecording && setShowScenarioPicker(v => !v)}>
                <span className="trigger-icon">{currentScenario.icon}</span>
                <span className="trigger-text">
                  <span className="trigger-label">Context</span>
                  <span className="trigger-value">{currentScenario.label}</span>
                </span>
                <svg className={`chevron ${showScenarioPicker ? "open" : ""}`} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showScenarioPicker && (
                <div className="picker-popover">
                  {SCENARIOS.map(s => (
                    <button key={s.value} className={`picker-option ${scenario === s.value ? "active" : ""}`} onClick={() => { setScenario(s.value); setShowScenarioPicker(false); }}>
                      <span className="option-icon">{s.icon}</span>
                      <span className="option-label">{s.label}</span>
                      <svg className="option-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Pair */}
            <div className="lang-pair-wrap" ref={langPickerRef}>
              <div className="lang-pair-pill">
                <button className="lang-pill-btn" disabled={isRecording} onClick={() => !isRecording && setOpenLangPicker(p => p === "source" ? null : "source")}>
                  <Flag code={sourceLangObj.code} size={20} />
                  <span className="lang-pill-text">
                    <span className="lang-pill-label">Spoken in</span>
                    <span className="lang-pill-value">{sourceLangObj.label}</span>
                  </span>
                  <svg className={`chevron ${openLangPicker === "source" ? "open" : ""}`} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button className="lang-swap-btn" disabled={isRecording} onClick={swapLanguages} title="Swap">
                  <span className="swap-icon">⇄</span>
                </button>
                <button className="lang-pill-btn" disabled={isRecording} onClick={() => !isRecording && setOpenLangPicker(p => p === "target" ? null : "target")}>
                  <Flag code={targetLangObj.code} size={20} />
                  <span className="lang-pill-text">
                    <span className="lang-pill-label">Translate to</span>
                    <span className="lang-pill-value">{targetLangObj.label}</span>
                  </span>
                  <svg className={`chevron ${openLangPicker === "target" ? "open" : ""}`} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              {openLangPicker === "source" && (
                <div className="lang-dropdown source">
                  {LANGUAGES.map(l => (
                    <button key={l.value} className={`picker-option ${sourceLang === l.value ? "active" : ""}`} onClick={() => { setSourceLang(l.value); setOpenLangPicker(null); }}>
                      <span className="option-flag"><Flag code={l.code} size={20} /></span>
                      <span className="option-label">{l.label}</span>
                      <svg className="option-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  ))}
                </div>
              )}
              {openLangPicker === "target" && (
                <div className="lang-dropdown target">
                  {LANGUAGES.map(l => (
                    <button key={l.value} className={`picker-option ${targetLang === l.value ? "active" : ""}`} onClick={() => { setTargetLang(l.value); setOpenLangPicker(null); }}>
                      <span className="option-flag"><Flag code={l.code} size={20} /></span>
                      <span className="option-label">{l.label}</span>
                      <svg className="option-check" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isRecording && (
              <button onClick={toggleAIListening} className={`btn-ai-toggle ${isAIListening ? "btn-ai-listening" : "btn-ai-paused"}`}>
                {isAIListening ? "🟢 AI Listening" : "⏸ AI Paused"}
              </button>
            )}

            {/* Start/Stop Button */}
            <button onClick={isRecording ? stopCall : startCall} className={`btn-main ${isRecording ? "btn-stop" : "btn-start"}`}>
              {isRecording ? "⏹ End Session" : "▶ Start Session"}
            </button>
          </div>
        </header>

        <div className="main-grid">
          <div className="glass transcript-panel">
            <div className="panel-header">
              <div className={`recording-dot ${isRecording ? "active" : ""}`} />
              <span className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>Live Transcript · <Flag code={sourceLangObj.code} size={14} /> {sourceLangObj.label}</span>
            </div>
            <div className="transcript-body">
              {transcript.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="empty-text">Waiting for audio...</span>
                </div>
              ) : (
                transcript.map((line, i) => (
                  <div key={i} className="transcript-line">
                    <span className="line-number">[{i + 1}]</span>
                    <p className="line-text">{line}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="right-col">
            <div className="summary-card">
              <div className="summary-section">
                <div className="section-label">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Summary · <Flag code={targetLangObj.code} size={12} /> {targetLangObj.label}
                </div>
                <p className="summary-text">{summary}</p>
              </div>
              <div className="summary-section">
                <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Flag code={sourceLangObj.code} size={12} /> {sourceLangObj.label}
                  <span style={{ margin: "0 4px", opacity: 0.4 }}>→</span>
                  <Flag code={targetLangObj.code} size={12} /> {targetLangObj.label}
                  <span style={{ marginLeft: 4, opacity: 0.5 }}>· Translation</span>
                </div>
                <p className="translation-text">{translation}</p>
              </div>
            </div>

            <div className="glass replies-card">
              <div className="panel-header" style={{ borderBottom: "1px solid var(--border-subtle)", marginBottom: "14px", padding: "0 0 12px 0", background: "transparent" }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-faint)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="panel-title" style={{ display: "flex", alignItems: "center", gap: 5 }}>Suggested Replies · <Flag code={targetLangObj.code} size={13} /> / <Flag code={sourceLangObj.code} size={13} /></span>
              </div>

              {replies.map((reply, index) => {
                const parts = reply.split("\n").map(p => p.trim()).filter(Boolean);
                return (
                  <button key={index} className="reply-btn" onClick={() => handleReplyClick(reply)}>
                    <div>
                      <div className="reply-top">{parts[0] ?? reply}</div>
                      {parts.length > 1 && <div className="reply-bottom">{parts.slice(1).join(" · ")}</div>}
                    </div>
                    <svg className="speaker-icon" width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}