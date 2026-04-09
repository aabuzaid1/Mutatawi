'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMicOutline, IoStopOutline, IoCloseOutline } from 'react-icons/io5';

interface VoiceRecorderProps {
    onResult: (text: string) => void;
    onUpdate?: (text: string) => void;
    disabled: boolean;
}

export default function VoiceRecorder({ onResult, onUpdate, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const shouldListenRef = useRef<boolean>(false);

    const startRecording = useCallback(() => {
        // Check for Web Speech API support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('متصفحك لا يدعم التعرف على الصوت. استخدم Chrome أو Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += t + ' ';
                } else {
                    interimTranscript += t;
                }
            }

            setTranscript(prev => {
                const base = finalTranscript || prev;
                const currentText = (base + interimTranscript).trim();
                // Send live update to parent textarea
                if (onUpdate) {
                    onUpdate(currentText);
                }
                return currentText;
            });
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            if (event.error === 'not-allowed') {
                alert('الرجاء السماح للمتصفح باستخدام الميكروفون.');
            } else {
                alert('خطأ في التعرف على الصوت: ' + event.error);
            }
        };

        recognition.onend = () => {
            if (shouldListenRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Restart failed', e);
                    setIsRecording(false);
                    shouldListenRef.current = false;
                }
            } else {
                setIsRecording(false);
            }
        };

        recognitionRef.current = recognition;
        shouldListenRef.current = true;
        recognition.start();
        setIsRecording(true);
        setTranscript('');
    }, [onUpdate]);

    const stopRecording = useCallback(() => {
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);

        if (transcript.trim()) {
            onResult(transcript.trim());
            setTranscript('');
        }
    }, [transcript, onResult]);

    const cancelRecording = useCallback(() => {
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);
        setTranscript('');
    }, []);

    return (
        <>
            {/* Mic Button */}
            <motion.button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 ${
                    isRecording
                        ? 'bg-red-100 text-red-600'
                        : 'hover:bg-slate-100 text-slate-500'
                }`}
                whileTap={{ scale: 0.9 }}
            >
                {isRecording ? (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                        <IoStopOutline size={18} />
                    </motion.div>
                ) : (
                    <IoMicOutline size={18} />
                )}
            </motion.button>

            {/* Recording Indicator */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-auto sm:bottom-24 sm:w-96 mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <motion.div
                                className="w-3 h-3 bg-red-500 rounded-full"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            />
                            <span className="text-sm font-bold text-slate-700">جاري التسجيل...</span>
                            <button
                                onClick={cancelRecording}
                                className="mr-auto p-1 hover:bg-slate-100 rounded-lg"
                            >
                                <IoCloseOutline size={18} className="text-slate-400" />
                            </button>
                        </div>
                        {transcript && (
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed" dir="rtl">
                                {transcript}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
