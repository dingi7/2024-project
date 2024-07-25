import React, { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimateOnScrollProps {
  children: ReactNode;
  delay?: number;
}

const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({ children, delay = 0.2 }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.2, delay }}
    >
      {children}
    </motion.div>
  );
};

export default AnimateOnScroll;