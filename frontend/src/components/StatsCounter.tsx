import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatItem {
  number: number;
  label: string;
  suffix?: string;
}

interface StatsCounterProps {
  stats: StatItem[];
}

const StatsCounter: React.FC<StatsCounterProps> = ({ stats }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    if (isInView) {
      stats.forEach((stat, index) => {
        let start = 0;
        const end = stat.number;
        const duration = 2000; // 2 seconds
        const incrementTime = 50; // 50ms intervals
        const increment = end / (duration / incrementTime);

        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCounts(prev => {
              const newCounts = [...prev];
              newCounts[index] = end;
              return newCounts;
            });
            clearInterval(timer);
          } else {
            setCounts(prev => {
              const newCounts = [...prev];
              newCounts[index] = Math.floor(start);
              return newCounts;
            });
          }
        }, incrementTime);

        return () => clearInterval(timer);
      });
    }
  }, [isInView, stats]);

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="text-white"
        >
          <div className="text-3xl md:text-4xl font-bold mb-2">
            {counts[index].toLocaleString()}{stat.suffix || ''}
          </div>
          <div className="text-indigo-100 text-sm md:text-base">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCounter;