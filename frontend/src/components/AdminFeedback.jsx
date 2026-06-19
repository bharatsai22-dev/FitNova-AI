import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export default function AdminFeedBack({ userId, onBackToDashboard }) {
  const [feedbackType, setFeedbackType] = useState('recommendation');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isDispatched, setIsDispatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDispatchFeedback = (e) => {
    e.preventDefault();
    if (!feedbackSubject || !feedbackMessage) return;

    setIsLoading(true);

    // 1. Explicitly initialize EmailJS right at the execution gate
    emailjs.init('jyy-2mPTCkN6p5nAB');

    // 2. Exact key definitions mapping directly to your dashboard template dynamic brackets
    const templateParams = {
      email: 'bharatsaikarre1359@gmail.com', // 🌟 FIXED: Changed from to_email to email to match {{email}}
      user_id: userId || 'BVS Inc. Analytics Terminal',
      feedback_type: feedbackType.toUpperCase(),
      subject: feedbackSubject,      
      message: feedbackMessage,      
      timestamp: new Date().toLocaleString()
    };

    // 3. Constant string declarations for your setup
    const SERVICE_ID = 'service_cbnd5zi';
    const TEMPLATE_ID = 'template_n4o03gt'; 

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
      .then((response) => {
        console.log('Email successfully dispatched!', response.status, response.text);
        setIsDispatched(true);
        setIsLoading(false);
        
        // Wipe local form buffers
        setFeedbackSubject('');
        setFeedbackMessage('');

        setTimeout(() => {
          setIsDispatched(false);
        }, 4000);
      })
      .catch((error) => {
        console.error('FAILED to dispatch email.', error);
        alert(`⚠️ Transmission Interrupted!\nReason: ${error.text || 'Handshake rejected.'}`);
        setIsLoading(false);
      });
  };

  return (
    <div className="relative bg-[#151515] bg-opacity-90 border border-stone-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl overflow-hidden">
      {/* HUD Corner Decorations */}
      <span className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-[#FFD700]/50" />
      <span className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-[#FFD700]/50" />
      <span className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-[#FFD700]/50" />
      <span className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-[#FFD700]/50" />

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg text-[#FFD700]">
          <Mail size={18} />
        </div>
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Admin Support Gateway</h3>
          <p className="text-[10px] font-mono text-[#FFD700]/80 uppercase tracking-widest">// Direct pipeline to system creator</p>
        </div>
      </div>
      <p className="text-stone-400 text-xs mb-6 leading-relaxed">
        Have structural feature recommendations, website bugs, or performance complaints? Submit your feedback down below.
      </p>

      {isDispatched ? (
        <div className="bg-[#32CD32]/10 border border-[#32CD32]/30 rounded-xl p-6 text-center space-y-2">
          <CheckCircle2 size={32} className="text-[#32CD32] mx-auto animate-bounce" />
          <h4 className="text-xs font-black uppercase tracking-widest text-white">Transmission Successful</h4>
          <p className="text-[11px] text-stone-400">Feedback dispatched via EmailJS. Template data routed cleanly.</p>
        </div>
      ) : (
        <form onSubmit={handleDispatchFeedback} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">Classification Tag</label>
            <div className="grid grid-cols-3 gap-2">
              {['recommendation', 'complaint', 'bug'].map((type) => (
                <button
                  key={type} type="button" onClick={() => setFeedbackType(type)}
                  className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                    feedbackType === type 
                      ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.25)]' 
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">Subject Stream</label>
            <input
              type="text" value={feedbackSubject} onChange={(e) => setFeedbackSubject(e.target.value)} required
              placeholder="e.g., Requesting interactive weight progress graph logs"
              className="w-full bg-stone-900 border border-stone-800 focus:border-[#FFD700]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">Detailed Log Description</label>
            <textarea
              rows={5} value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} required
              placeholder="Describe your operational bottleneck or recommendation vector..."
              className="w-full bg-stone-900 border border-stone-800 focus:border-[#FFD700]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onBackToDashboard}
              className="flex-1 py-2.5 border border-stone-800 text-stone-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FFD700] hover:brightness-110 text-[#1C1C1C] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50"
            >
              <Send size={13} /> {isLoading ? 'Transmitting...' : 'Dispatch to Mail'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}