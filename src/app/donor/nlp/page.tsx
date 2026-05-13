"use client";
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/context/WalletContext';
import ContractABI from '@/contracts/EduGrantVault.json';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'confirmation';
  content: string;
  intent?: any;
  recipients?: string[];
  amount?: number;
  status?: 'pending' | 'processing' | 'success' | 'error';
}

export default function NLPDonorPage() {
    console.log("NLPDonorPage rendered. Wallet connected:", !!useWallet().account);
    console.log("Gemini API Key available:", process.env.GEMINI_API_KEY);
  const { account, signer } = useWallet();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Hi! I'm your AI donation assistant. You can say things like:\n\n• 'Donate 500 USDC to all students of Dayananda Sagar College of Engineering'\n• 'Send 100 USDC to student 0x1234...'\n• 'Donate 50 USDC to all CS students'\n\nType or click the microphone to start.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingDonation, setProcessingDonation] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto-submit after voice input
        setTimeout(() => handleSend(transcript), 100);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition not supported in this browser.');
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    if (!account || !signer) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: '❌ Please connect your wallet first.',
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Add thinking message
    const thinkingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: thinkingId,
      type: 'bot',
      content: '🤔 Processing your request...',
    }]);

    try {
      // Call intent API
      const res = await fetch('/api/donor/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse intent');

      const { intent } = data;
      const recipientCount = intent.recipients?.length || 0;

      if (recipientCount === 0) {
        throw new Error('No students match your request.');
      }

      // Replace thinking message with confirmation
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      const confirmMsg: Message = {
        id: Date.now().toString(),
        type: 'confirmation',
        content: intent.confirmationMessage,
        intent,
        recipients: intent.recipients,
        amount: intent.amount,
        status: 'pending',
      };
      setMessages(prev => [...prev, confirmMsg]);
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ Error: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (msgId: string, recipients: string[], amount: number) => {
    // Update message status to processing
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, status: 'processing' } : m
    ));
    setProcessingDonation(true);

    const contract = new ethers.Contract(contractAddress, ContractABI.abi, signer);
    const amountWei = ethers.parseUnits(amount.toString(), 6);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const student = recipients[i];
      try {
        // Update message to show progress
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, content: `${m.content}\n\n⏳ Donating to ${student.slice(0,6)}... (${i+1}/${recipients.length})` } : m
        ));

        const tx = await contract.fundStudent(student, amountWei);
        await tx.wait();
        successCount++;
      } catch (err: any) {
        errors.push(`${student.slice(0,6)}: ${err.message.slice(0,50)}`);
      }
    }

    // Update final status
    const finalMsg = successCount === recipients.length
      ? `✅ Successfully donated ${amount} USDC to all ${successCount} student(s)!`
      : `⚠️ Partial success: ${successCount}/${recipients.length} succeeded. Errors: ${errors.join('; ')}`;

    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, status: 'success', content: finalMsg } : m
    ));
    setProcessingDonation(false);
  };

  const handleCancel = (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, status: 'error', content: '❌ Donation cancelled by user.' } : m
    ));
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center px-4">
        <div className="bg-white p-10 rounded-2xl shadow-sm border text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#4A4238] mb-2">Connect Wallet</h2>
          <p className="text-[#8C8276]">Please connect your donor wallet to use the AI assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pt-12 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#4A4238]">AI Donation Assistant</h1>
          <p className="text-[#8C8276] mt-1">Natural language donations – just type or speak</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBE6E0] shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.type === 'user'
                        ? 'bg-[#A38A63] text-white'
                        : msg.type === 'confirmation'
                        ? 'bg-[#EDF2EA] border border-[#CDE0C0] text-[#3B4F2B]'
                        : 'bg-[#F5F0E6] text-[#4A4238]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    {msg.type === 'confirmation' && msg.status === 'pending' && (
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleConfirm(msg.id, msg.recipients!, msg.amount!)}
                          disabled={processingDonation}
                          className="px-4 py-1 bg-[#7A9C59] text-white rounded-lg text-sm hover:bg-[#5C7A43] transition disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancel(msg.id)}
                          className="px-4 py-1 bg-gray-300 text-[#4A4238] rounded-lg text-sm hover:bg-gray-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {msg.status === 'processing' && (
                      <div className="mt-2 text-xs text-[#5C7A43] animate-pulse">Processing transactions...</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-[#EBE6E0] p-4 bg-white">
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your donation command here..."
                className="flex-1 px-4 py-2 border border-[#EBE6E0] rounded-xl focus:ring-2 focus:ring-[#A38A63] focus:border-transparent outline-none resize-none"
                disabled={loading || processingDonation}
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSend()}
                  disabled={loading || processingDonation || !input.trim()}
                  className="px-4 py-2 bg-[#A38A63] text-white rounded-xl hover:bg-[#8F7856] transition disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  onClick={startListening}
                  disabled={loading || processingDonation || isListening}
                  className={`px-4 py-2 rounded-xl transition ${
                    isListening
                      ? 'bg-red-500 animate-pulse text-white'
                      : 'bg-[#F5F0E6] text-[#A38A63] hover:bg-[#EBE6E0]'
                  }`}
                  title="Voice input"
                >
                  🎤
                </button>
              </div>
            </div>
            {isListening && (
              <p className="text-xs text-[#A38A63] mt-2 animate-pulse">Listening... speak now</p>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-center text-[#8C8276]">
          💡 Your wallet must have enough USDC + approve the contract before donating (first donation will prompt approval).
        </div>
      </div>
    </div>
  );
}