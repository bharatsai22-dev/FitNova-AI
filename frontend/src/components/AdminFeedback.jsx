import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  ArrowLeft, 
  Terminal, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle,
  FileText
} from 'lucide-react';

// HUD Accent framing component matching the primary application ecosystem
const CornerBrackets = ({ color = '#FFD700', opacity = 'opacity-50' }) => (
  <>
    <span className={`absolute top-2 left-2 w-2.5 h-2.5 border-t border-l ${opacity} pointer-events-none`} style={{ borderColor: color }} />
    <span className={`absolute top-2 right-2 w-2.5 h-2.5 border-t border-r ${opacity} pointer-events-none`} style={{ borderColor: color }} />
    <span className={`absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l ${opacity} pointer-events-none`} style={{ borderColor: color }} />
    <span className={`absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r ${opacity} pointer-events-none`} style={{ borderColor: color }} />
  </>
);

export default function AdminFeedback({ userId, onBackToDashboard }) {
  const [ticketType, setTicketType] = useState('complaint');
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);

  const categories = [
    { id: 'complaint', name: 'System Complaint', icon: ShieldAlert, color: '#FF3131' },
    { id: 'recommendation', name: 'Feature Request', icon: FileText, color: '#FFD700' },
    { id: 'bug', name: 'Critical Bug Report', icon: AlertTriangle, color: '#FF5722' },
    { id: 'general', name: 'General Support', icon: HelpCircle, color: '#00E5FF' },
  ];

  const priorityLevels = [
    { id: 'low', label: 'Routine (Low)' },
    { id: 'medium', label: 'Operational (Medium)' },
    { id: 'high', label: 'Urgent (High)' },
    { id: 'critical', label: 'Breach/Showstopper (Critical)' }
  ];

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFormSubmission = async (e) => {
    e.preventDefault();
    if (!subject || !message) return;

    setIsSubmitting(true);
    setTerminalLogs([]);

    // ── Simulated Secure Core Telemetry Transmission Sequence ──
    const logs = [
      "🔄 Initializing encrypted communication tunnel...",
      "🛡️ Resolving server endpoints for admin@bvsinc.com...",
      "📦 Packaging secure behavioral state parameters...",
      "🔑 Attaching cryptographic system user identification payload...",
      "🚀 Executing uplink sequence to BVS mainframes..."
    ];

    for (let log of logs) {
      setTerminalLogs(prev => [...prev, log]);
      await sleep(60000 / 100); // Fluid typewriter speed step simulation
    }

    // Direct routing address configuration matching core infrastructure specs
    const adminEmail = "admin@bvsinc.com";
    const mailtoSubject = `[${ticketType.toUpperCase()}] [PRIORITY: ${priority.toUpperCase()}] ${subject}`;
    const mailtoBody = `==== BVS SYSTEM SECURITY PAYLOAD ====\n` +
                       `USER TARGET ID : ${userId || 'UNKNOWN_NODE'}\n` +
                       `TELEMETRY HUB  : COMMAND SUITE V1\n` +
                       `CLASSIFICATION : ${ticketType.toUpperCase()}\n` +
                       `PRIORITY LEVEL : ${priority.toUpperCase()}\n` +
                       `TIMESTAMP UTC  : ${new Date().toISOString()}\n` +
                       `====================================\n\n` +
                       `REPORTED LOG CONTENT:\n${message}\n\n` +
                       `// End of Diagnostic Stream.`;

    // Dispatches standard email application intent with properly sanitized components
    window.location.href = `mailto:${adminEmail}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

    setIsSubmitting(false);
    setIsSuccess(true);

    // Auto reset view state back to fresh inputs after brief buffer window
    setTimeout(() => {
      setIsSuccess(false);
      setSubject('');
      setMessage('');
    }, 5000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fadeIn space-y-6">
      
      {/* Back Navigation Bar */}
      <button 
        onClick={onBackToDashboard}
        className="group flex items-center gap-2 text-xs font-mono text-stone-400 hover:text-[#FFD700] transition-colors uppercase tracking-wider"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Back to Operational Grid
      </button>

      {/* Main Form Body Container */}
      <div className="relative bg-[#151515] bg-opacity-90 border border-stone-800/80 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
        <CornerBrackets color={categories.find(c => c.id === ticketType)?.color || '#FFD700'} />
        
        {/* Header telemetry tags */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/60 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-xl text-[#FFD700]">
              <Mail size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-wider text-white">Admin Command Portal</h3>
              <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">// Secure Route to BVS Inc. Executives</p>
            </div>
          </div>
          <div className="text-right font-mono text-[9px] text-stone-500 uppercase hidden md:block">
            Status: Gateway Encrypted <br />
            Target: admin@bvsinc.com
          </div>
        </div>

        {isSuccess ? (
          /* Transmission Success UI Feedback Vector */
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-[#32CD32]/10 border border-[#32CD32]/40 flex items-center justify-center text-[#32CD32] shadow-[0_0_20px_rgba(50,205,50,0.2)]">
              <CheckCircle2 size={32} className="animate-bounce" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-widest text-white">Packet Handshake Complete</h4>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed">
              Your systemic issue data payload has been successfully formatted and compiled into your active hardware mail engine.
            </p>
            <div className="w-full max-w-sm bg-black/40 border border-stone-900 rounded-lg p-3 text-[10px] font-mono text-[#32CD32]/80">
              ✔️ Payload Handed over to operational system pipelines.
            </div>
          </div>
        ) : (
          /* Core Data Input Interface */
          <form onSubmit={handleFormSubmission} className="space-y-6">
            
            {/* Classification Pipeline Selectors */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Transmission Classification Vector
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = ticketType === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTicketType(cat.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center gap-2 transition-all group ${
                        isActive 
                          ? 'bg-stone-900 text-white shadow-lg' 
                          : 'bg-black/30 text-stone-500 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                      }`}
                      style={{ borderColor: isActive ? cat.color : '' }}
                    >
                      <Icon 
                        size={18} 
                        style={{ color: isActive ? cat.color : '' }}
                        className={isActive ? 'scale-110 transition-transform' : 'opacity-60 group-hover:opacity-100'} 
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Matrix Level Indicators */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Threat Matrix Priority Rating
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {priorityLevels.map((lvl) => {
                  const isActive = priority === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setPriority(lvl.id)}
                      className={`py-2 px-3 rounded-lg text-[10px] font-mono uppercase border transition-all text-center ${
                        isActive 
                          ? 'bg-[#FFD700] text-black font-black border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.2)]' 
                          : 'bg-black/20 text-stone-400 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Stream Headers */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">Subject Stream Header</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief structural header summarizing issue or recommendation..."
                className="w-full bg-black/40 border border-stone-800/80 focus:border-[#FFD700]/50 rounded-xl px-4 py-3 text-xs text-white placeholder-stone-600 outline-none transition-all"
              />
            </div>

            {/* Core Message Body Text Area Payload */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">Detailed Telemetry Log Payload</label>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Flesh out structural bottlenecks, user experience feedback, technical complaints, or feature requests with absolute high-fidelity description context..."
                className="w-full bg-black/40 border border-stone-800/80 focus:border-[#FFD700]/50 rounded-xl px-4 py-3 text-xs text-white placeholder-stone-600 outline-none transition-all resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Form Actions Footer Area */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToDashboard}
                className="sm:w-1/3 py-3 border border-stone-800 text-stone-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors bg-black/10"
              >
                Abort Stream
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FFD700] hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none text-[#1C1C1C] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,215,0,0.15)]"
              >
                <Send size={14} /> 
                {isSubmitting ? 'Compiling Packet Layers...' : 'Transmit Payload to Admin'}
              </button>
            </div>
          </form>
        )}

        {/* Live Active Submission Logs Window */}
        {isSubmitting && (
          <div className="mt-6 border border-stone-800 bg-black rounded-xl p-4 font-mono text-[10px] text-stone-400 space-y-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 text-[#FFD700] font-bold border-b border-stone-900 pb-1.5 mb-2">
              <Terminal size={12} className="animate-spin" />
              <span>TERMINAL CONNECT MATRIX DISPATCH</span>
            </div>
            {terminalLogs.map((log, index) => (
              <div key={index} className="animate-fadeIn truncate">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}