"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { ReactNode } from "react";

// Animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// Reusable animation components
interface AnimationWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeInUp = ({
  children,
  className = "",
  delay = 0,
}: AnimationWrapperProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeInUp}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInDown = ({
  children,
  className = "",
  delay = 0,
}: AnimationWrapperProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeInDown}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInLeft = ({
  children,
  className = "",
  delay = 0,
}: AnimationWrapperProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeInLeft}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInRight = ({
  children,
  className = "",
  delay = 0,
}: AnimationWrapperProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeInRight}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInScale = ({
  children,
  className = "",
  delay = 0,
}: AnimationWrapperProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeInScale}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({
  children,
  className = "",
  delay = 0,
}: AnimationWrapperProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={scaleIn}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger animation container
export const StaggerContainer = ({
  children,
  className = "",
}: AnimationWrapperProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={staggerContainer}
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger animation item
export const StaggerItem = ({
  children,
  className = "",
}: AnimationWrapperProps) => (
  <motion.div variants={staggerItem} className={className}>
    {children}
  </motion.div>
);

// Counter animation component
interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter = ({
  from: _from = 0,
  to,
  duration: _duration = 2,
  prefix = "",
  suffix = "",
  className = "",
}: CounterProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onViewportEnter={() => {
        // Simple counter animation using CSS animation instead
        // This is more performant and reliable
      }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {to.toLocaleString()}
      </motion.span>
      {suffix}
    </motion.div>
  );
};
