export function Skeleton({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div 
      className={`skeleton ${className || ''}`} 
      style={{
        backgroundColor: 'var(--border-color)',
        borderRadius: 'var(--radius-md)',
        animation: 'pulse 1.5s infinite ease-in-out',
        ...style
      }}
    />
  );
}

// Add pulse animation to base.css or tokens.css if not already there
// Actually I'll add it to base.css in a moment.
