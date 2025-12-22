
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, BrainCircuit, Loader2 } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, isThinking?: boolean }[]>([
    { role: 'ai', text: 'Olá! Sou a IzA sua assistente imobiliária inteligente. Posso ajudar a analisar contratos, sugerir preços ou criar descrições. Como posso ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsThinking(true);

    // Simulação de resposta AI com "Thinking Mode"
    setTimeout(() => {
      setIsThinking(false);
      let response = "Posso ajudar com isso. ";

      if (userMsg.toLowerCase().includes('preço') || userMsg.toLowerCase().includes('valor')) {
        response += "Analisando o mercado local e imóveis similares (gemini-3-pro)... Sugiro um valor entre €450k e €480k para esta região, considerando a alta demanda recente.";
      } else if (userMsg.toLowerCase().includes('contrato')) {
        response += "Verificando cláusulas padrão... O documento parece sólido, mas recomendo atenção à cláusula 4 sobre rescisão antecipada.";
      } else {
        response += "Estou processando sua solicitação utilizando a base de dados atualizada.";
      }

      setMessages(prev => [...prev, { role: 'ai', text: response, isThinking: false }]);
    }, 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-200 flex flex-col max-h-[400px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-white">
              <div className="bg-white/20 p-1.5 rounded-full">
                <BrainCircuit size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Gemini Assistant</h3>
                <p className="text-[10px] text-primary-100 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Online • Thinking Mode
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 h-80">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-full p-3 text-sm ${msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-tr-none'
                    : 'bg-slate-700 text-gray-200 rounded-tl-none shadow-sm border border-slate-600'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-full rounded-tl-none p-3 shadow-sm border border-slate-600 flex items-center space-x-2">
                  <Loader2 size={14} className="animate-spin text-primary-500" />
                  <span className="text-xs text-gray-400 italic">Pensando e analisando dados...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="flex items-center space-x-2 bg-slate-900 rounded-full px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte algo..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="text-primary-500 hover:text-primary-600 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-primary-500/30 transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-slate-700 text-gray-300 rotate-90' : 'bg-gradient-to-r from-primary-600 to-primary-400 text-white'}`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}

        {!isOpen && (
          <span className="absolute right-16 bg-slate-800 text-gray-200 px-3 py-1 rounded-full text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
            Assistente IzA
          </span>
        )}
      </button>
    </div>
  );
};
