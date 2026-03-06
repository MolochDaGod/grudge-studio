/**
 * Magical Animation Components for Skill Tree
 * 
 * Sparkle effects, swoop animations, and collection transitions
 */

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { createPortal } from 'react-dom';

interface SparkleEffectProps {
  x: number;
  y: number;
  color: string;
  onComplete?: () => void;
}

const SPARKLE_COLORS = ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7', '#3b82f6', '#22c55e'];

function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360,
    distance: 30 + Math.random() * 40,
    size: 4 + Math.random() * 6,
    delay: Math.random() * 0.2,
    color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
  }));
}

export const SparkleEffect = memo(function SparkleEffect({ x, y, color, onComplete }: SparkleEffectProps) {
  const [sparkles] = useState(() => generateSparkles(12));
  
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return createPortal(
    <div 
      className="fixed pointer-events-none z-[9999]"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full"
          style={{
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: sparkle.color,
            boxShadow: `0 0 ${sparkle.size * 2}px ${sparkle.color}`,
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 1 
          }}
          animate={{ 
            x: Math.cos(sparkle.angle * Math.PI / 180) * sparkle.distance,
            y: Math.sin(sparkle.angle * Math.PI / 180) * sparkle.distance,
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
          }}
          transition={{ 
            duration: 0.6, 
            delay: sparkle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
      
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 60,
          height: 60,
          background: `radial-gradient(circle, ${color}40, transparent)`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: [0, 2, 2.5], opacity: [0.8, 0.4, 0] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>,
    document.body
  );
});

interface MagicalFumeProps {
  x: number;
  y: number;
  color: string;
}

export const MagicalFume = memo(function MagicalFume({ x, y, color }: MagicalFumeProps) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    offsetX: (Math.random() - 0.5) * 40,
    offsetY: -20 - Math.random() * 30,
    delay: i * 0.05,
    size: 8 + Math.random() * 12,
  }));

  return createPortal(
    <div 
      className="fixed pointer-events-none z-[9998]"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-sm"
          style={{
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${color}60, ${color}20, transparent)`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
          animate={{ 
            x: p.offsetX,
            y: [0, p.offsetY, p.offsetY - 20],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1.2, 0.8],
          }}
          transition={{ 
            duration: 1.2, 
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>,
    document.body
  );
});

interface SwoopingNodeProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  nodeShape: 'circle' | 'star' | 'diamond' | 'hexagon';
  nodeContent: string;
  onComplete?: () => void;
}

function generateBezierPath(startX: number, startY: number, endX: number, endY: number) {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  const randomArc = (Math.random() - 0.5) * 300;
  const spiralOffset = Math.random() * 150;
  
  const control1X = startX + randomArc + spiralOffset;
  const control1Y = startY - 100 - Math.random() * 150;
  const control2X = endX - randomArc;
  const control2Y = midY + Math.random() * 100;
  
  return { control1X, control1Y, control2X, control2Y };
}

export const SwoopingNode = memo(function SwoopingNode({
  startX,
  startY,
  endX,
  endY,
  color,
  nodeShape,
  nodeContent,
  onComplete,
}: SwoopingNodeProps) {
  const progress = useMotionValue(0);
  const [path] = useState(() => generateBezierPath(startX, startY, endX, endY));
  
  const x = useTransform(progress, [0, 1], [startX, endX]);
  const y = useTransform(progress, [0, 1], [startY, endY]);
  const rotate = useTransform(progress, [0, 0.5, 1], [0, 360, 720]);
  const scale = useTransform(progress, [0, 0.3, 0.7, 1], [1, 1.3, 1.1, 0.8]);
  
  useEffect(() => {
    const t = (p: number) => {
      const t1 = 1 - p;
      const bezierX = t1*t1*t1*startX + 3*t1*t1*p*path.control1X + 3*t1*p*p*path.control2X + p*p*p*endX;
      const bezierY = t1*t1*t1*startY + 3*t1*t1*p*path.control1Y + 3*t1*p*p*path.control2Y + p*p*p*endY;
      return { x: bezierX, y: bezierY };
    };
    
    const animation = animate(progress, 1, {
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (latest) => {
        const pos = t(latest);
        x.set(pos.x);
        y.set(pos.y);
      },
      onComplete: () => {
        setTimeout(() => onComplete?.(), 100);
      },
    });
    
    return () => animation.stop();
  }, []);

  const shapeStyles = {
    circle: 'rounded-full',
    star: 'clip-path-star',
    diamond: 'rotate-45 rounded-sm',
    hexagon: 'clip-path-hexagon',
  };

  return createPortal(
    <motion.div
      className="fixed pointer-events-none z-[9997]"
      style={{ x, y, rotate, scale, translateX: '-50%', translateY: '-50%' }}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center border-2 ${shapeStyles[nodeShape]}`}
        style={{
          backgroundColor: `${color}30`,
          borderColor: color,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}50`,
        }}
      >
        <span 
          className={`text-xs font-bold ${nodeShape === 'diamond' ? '-rotate-45' : ''}`}
          style={{ color }}
        >
          {nodeContent}
        </span>
      </div>
      
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}40, transparent)`,
          filter: 'blur(8px)',
        }}
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ 
          duration: 0.3, 
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>,
    document.body
  );
});

interface GlowEffectProps {
  children: React.ReactNode;
  color: string;
  isActive: boolean;
}

export const GlowEffect = memo(function GlowEffect({ children, color, isActive }: GlowEffectProps) {
  return (
    <div className="relative">
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                background: `radial-gradient(circle, ${color}60, ${color}20, transparent)`,
                filter: 'blur(10px)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.9, 1.1, 0.9],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-lg border-2"
              style={{ borderColor: color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
});
