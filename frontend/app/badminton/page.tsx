'use client'

import React, { useState, useRef, useEffect } from 'react';
import './styles.css';

interface CoachFeedback {
  problem: string;
  improvement: string | string[];
  power_technique: string;
}

const i18n = {
  en: {
    title: "Badminton AI - Video",
    placeholder: "Select a technique",
    dragDrop: "Drag & drop video here",
    clickBrowse: "or click to browse",
    dropUpload: "Drop to upload!",
    btnUpload: "Upload & Analyze",
    btnUploading: "Uploading...",
    analyzing: "🏸 Analyzing, please wait...",
    errorReq: "❌ Network Request Error, please try again",
    alertFile: "Please select a video file first",
    alertAction: "Please select a technique first",
    alertErr: "There is an unexpected error",
    modalTitle: "AI Coach Analysis",
    issue: "Biomechanical Issue",
    plan: "Action Plan",
    power: "Power Generation",
    export: "Export Report",
    gotIt: "Got it, Coach!",
    unknown: "Unknown Technique",
    techs: {
      high_clear: "High Clear",
      smash: "Smash ➔",
      smash_standard: "Standard Smash",
      smash_stick: "Stick Smash",
      smash_jump: "Jump Smash",
      smash_slice: "Slice Smash",
      half_smash: "Half Smash",
      drop_shot: "Drop Shot ➔",
      drop_slice: "Slice Drop",
      drop_reverse_slice: "Reverse Slice Drop",
      net_shot: "Net Shot",
      net_spin: "Net Spin",
    }
  },
  zh: {
    title: "羽毛球 AI 教练",
    placeholder: "请选择技术动作",
    dragDrop: "拖拽视频到此处",
    clickBrowse: "或点击浏览文件",
    dropUpload: "松开鼠标完成上传！",
    btnUpload: "上传并分析",
    btnUploading: "上传中...",
    analyzing: "🏸 正在分析，请稍候...",
    errorReq: "❌ 网络请求错误，请重试",
    alertFile: "请先选择一个视频文件",
    alertAction: "请先选择一个技术动作",
    alertErr: "发生未知错误",
    modalTitle: "AI 教练分析报告",
    issue: "动作诊断",
    plan: "改进方案",
    power: "发力技巧",
    export: "导出报告",
    gotIt: "明白，教练！",
    unknown: "未知动作",
    techs: {
      high_clear: "高远球",
      smash: "杀球 ➔",
      smash_standard: "重杀",
      smash_stick: "点杀",
      smash_jump: "跳杀",
      smash_slice: "劈杀",
      half_smash: "突击半场",
      drop_shot: "吊球 ➔",
      drop_slice: "劈吊",
      drop_reverse_slice: "滑板吊球",
      net_shot: "放网",
      net_spin: "搓球",
    }
  }
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [action, setAction] = useState<string>("");
  const [isLoading, setLoading] = useState<boolean>(false);
  const [hasError, setError] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const t = i18n[lang];
  const [showTechniques, setShowTechniques] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const techniquePickerRef = useRef<HTMLDivElement>(null);

  const techniques = [
    { id: 'high_clear', label: t.techs.high_clear },
    {
      id: 'smash',
      label: t.techs.smash,
      children: [
        { id: 'smash_standard', label: t.techs.smash_standard },
        { id: 'smash_stick',    label: t.techs.smash_stick    },
        { id: 'smash_jump',     label: t.techs.smash_jump     },
        { id: 'smash_slice',    label: t.techs.smash_slice    },
      ]
    },
    { id: 'half_smash', label: t.techs.half_smash },
    {
      id: 'drop_shot',
      label: t.techs.drop_shot,
      children: [
        { id: 'drop_slice',         label: t.techs.drop_slice         },
        { id: 'drop_reverse_slice', label: t.techs.drop_reverse_slice },
      ]
    },
    { id: 'net_shot', label: t.techs.net_shot },
    { id: 'net_spin', label: t.techs.net_spin },
  ];

  const flatTechniques = techniques.flatMap(item => item.children ? item.children : item);
  const selectedLabel = flatTechniques.find(item => item.id === action)?.label || t.placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (techniquePickerRef.current && !techniquePickerRef.current.contains(e.target as Node)) {
        setShowTechniques(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDragOver  = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLElement>)    => { e.preventDefault(); setIsDragging(false); };
  const handleDrop      = (e: React.DragEvent<HTMLElement>)    => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) { alert(t.alertAction); return; }
    if (!file)   { alert(t.alertFile);   return; }

    const formData = new FormData();
    formData.append("action",   action);
    formData.append("video",    file);
    formData.append("language", lang);

    setError(false);
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('http://127.0.0.1:8001/upload-video', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.status === 'processed') {
        setFeedback(result.llm_feedback);
        setLoading(false);
        setFile(null);
        setShowModal(true);
      }
    } catch (error) {
      console.error(error);
      setError(true);
      setLoading(false);
      alert(t.alertErr);
    }
  };

  const handleExport = () => {
    if (!feedback) return;
    const techniqueName = flatTechniques.find(item => item.id === action)?.label || t.unknown;
    const date = new Date().toLocaleDateString();
    const content =
      `🏸 ${t.modalTitle} 🏸\n\n` +
      `Date: ${date}\nTechnique: ${techniqueName}\n${'─'.repeat(40)}\n\n` +
      `[${t.issue}]\n${feedback.problem}\n\n` +
      `[${t.plan}]\n${Array.isArray(feedback.improvement) ? feedback.improvement.join('\n') : feedback.improvement}\n\n` +
      `[${t.power}]\n${feedback.power_technique}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `Badminton_Analysis_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="badminton-page">

      {/* Language switcher */}
      <div className="lang-switcher">
        <button onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''}>EN</button>
        <button onClick={() => setLang('zh')} className={lang === 'zh' ? 'active' : ''}>中文</button>
      </div>

      <h1>{t.title}</h1>

      <form className="card-form" onSubmit={handleSubmit}>

        {/* Technique picker */}
        <div className="technique-picker" ref={techniquePickerRef}>
          <div
            className="technique-picker-header"
            onClick={() => { setShowTechniques(!showTechniques); setHoveredItem(null); }}
          >
            <span className={action ? 'selected-label' : 'placeholder-label'}>{selectedLabel}</span>
            <span className={`chevron ${showTechniques ? 'open' : ''}`}>▼</span>
          </div>

          {showTechniques && (
            <div className="technique-dropdown">
              {techniques.map((item) => (
                <div key={item.id}>
                  {!item.children ? (
                    <div
                      className={`tech-option${action === item.id ? ' tech-option--selected' : ''}`}
                      onClick={() => { setAction(item.id); setShowTechniques(false); setHoveredItem(null); }}
                    >
                      {item.label}
                    </div>
                  ) : (
                    <div className="tech-group">
                      <div
                        className="tech-group-header"
                        onClick={() => setHoveredItem(hoveredItem === item.id ? null : item.id)}
                      >
                        <span>{item.label.replace(' ➔','')}</span>
                        <span className={`group-arrow ${hoveredItem === item.id ? 'open' : ''}`}>▾</span>
                      </div>
                      {hoveredItem === item.id && (
                        <div className="tech-group-children">
                          {item.children.map((child) => (
                            <div
                              key={child.id}
                              className={`tech-child${action === child.id ? ' tech-option--selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAction(child.id);
                                setShowTechniques(false);
                                setHoveredItem(null);
                              }}
                            >
                              {child.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone${isDragging ? ' dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileSelect} />
          {file ? (
            <p className="file-selected"><span>✅</span> {file.name}</p>
          ) : (
            <>
              <p className="drop-label">{isDragging ? t.dropUpload : t.dragDrop}</p>
              <p className="drop-sublabel">{t.clickBrowse}</p>
            </>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? t.btnUploading : t.btnUpload}
        </button>

        {/* Loading spinner */}
        {isLoading && (
          <div className="loading-indicator">
            <span>{t.analyzing}</span>
            <svg viewBox="0 0 100 100" className="shuttle-svg">
              <style>{`
                @keyframes spin-shuttle {
                  from { transform: rotate(0deg); }
                  to   { transform: rotate(360deg); }
                }
              `}</style>
              <defs>
                <linearGradient id="beltGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#064e3b" />
                  <stop offset="50%"  stopColor="#047857" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="85" r="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
              <g style={{ animation: 'spin-shuttle 1.5s linear infinite', transformOrigin: '50% 65%' }}>
                <rect x="38" y="75" width="24" height="4" fill="url(#beltGradient)" stroke="#022c22" strokeWidth="0.5" />
                {[...Array(16)].map((_, i) => (
                  <g key={i} transform={`rotate(${i * (360 / 16)} 50 65)`}>
                    <rect x="49.5" y="73" width="1" height="15" fill="#94a3b8" stroke="#64748b" strokeWidth="0.5" />
                    <path d="M47,65 C46,55 46,45 47,35 C48,25 52,25 53,35 C54,45 54,55 53,65 L50,73 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
                    <line x1="50" y1="35" x2="50" y2="73" stroke="#94a3b8" strokeWidth="0.5" />
                  </g>
                ))}
              </g>
            </svg>
          </div>
        )}

        {/* Error */}
        {hasError && <div className="error-banner">{t.errorReq}</div>}
      </form>

      {/* Modal */}
      {showModal && feedback && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-card">

            <div className="modal-header">
              <h2><span>🏸</span> {t.modalTitle}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">

              {/* Problem */}
              <div className="feedback-section">
                <div className="section-header">
                  <div className="section-icon red">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="section-title">{t.issue}</span>
                </div>
                <div className="feedback-box red">{feedback.problem}</div>
              </div>

              {/* Improvement */}
              <div className="feedback-section">
                <div className="section-header">
                  <div className="section-icon blue">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="section-title">{t.plan}</span>
                </div>
                <div className="feedback-box blue">
                  {Array.isArray(feedback.improvement) ? (
                    <ul className="improvement-list">
                      {feedback.improvement.map((step, index) => (
                        <li key={index} className="improvement-item">
                          <span className="improvement-num">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{feedback.improvement}</p>
                  )}
                </div>
              </div>

              {/* Power */}
              <div className="feedback-section">
                <div className="section-header">
                  <div className="section-icon amber">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="section-title">{t.power}</span>
                </div>
                <div className="feedback-box amber">{feedback.power_technique}</div>
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn-export" onClick={handleExport}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.export}
              </button>
              <button className="btn-got-it" onClick={() => setShowModal(false)}>
                {t.gotIt}
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}