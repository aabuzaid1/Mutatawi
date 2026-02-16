'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { IoPeopleOutline, IoTimeOutline, IoBusinessOutline, IoHeartOutline } from 'react-icons/io5';

function AnimatedCounter({ target, duration = 2.5 }: { target: number; duration?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const startTime = Date.now();
        const endTime = startTime + duration * 1000;

        // Smooth easeOutExpo counter
        const timer = setInterval(() => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            const current = Math.floor(eased * target);
            setCount(current);

            if (progress >= 1) {
                setCount(target);
                clearInterval(timer);
            }
        }, 1000 / 60);

        return () => clearInterval(timer);
    }, [isInView, target, duration]);

    return <span ref={ref}>{count.toLocaleString('ar-SA')}</span>;
}

export default function Stats() {
    const stats = [
        {
            icon: IoPeopleOutline,
            value: 5200,
            label: 'متطوع نشط',
            color: 'from-primary-500 to-primary-600',
            bgColor: 'bg-primary-50',
            textColor: 'text-primary-600',
        },
        {
            icon: IoTimeOutline,
            value: 28000,
            label: 'ساعة تطوعية',
            color: 'from-success-500 to-success-600',
            bgColor: 'bg-success-50',
            textColor: 'text-success-600',
        },
        {
            icon: IoBusinessOutline,
            value: 340,
            label: 'منظمة شريكة',
            color: 'from-warning-500 to-warning-600',
            bgColor: 'bg-warning-50',
            textColor: 'text-warning-600',
        },
        {
            icon: IoHeartOutline,
            value: 1500,
            label: 'فرصة تطوعية',
            color: 'from-danger-500 to-danger-600',
            bgColor: 'bg-danger-50',
            textColor: 'text-danger-600',
        },
    ];

    return (
        <section className="section-padding bg-white relative">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{
                                    delay: index * 0.12,
                                    duration: 0.6,
                                    ease: [0.25, 0.46, 0.45, 0.94] as const,
                                }}
                                className="text-center group"
                            >
                                <motion.div
                                    className={`w-16 h-16 rounded-2xl ${stat.bgColor} flex items-center justify-center mx-auto mb-4`}
                                    whileHover={{
                                        scale: 1.15,
                                        rotate: -5,
                                        transition: { type: 'spring', stiffness: 300, damping: 15 }
                                    }}
                                >
                                    <Icon className={stat.textColor} size={28} />
                                </motion.div>
                                <h3 className="text-3xl sm:text-4xl font-black text-slate-800 mb-1">
                                    <AnimatedCounter target={stat.value} />+
                                </h3>
                                <p className="text-slate-500 font-medium">{stat.label}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
