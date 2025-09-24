import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: "square" | "circle" | "triangle";
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

export default function Confetti({ 
  isActive, 
  duration = 3000, 
  particleCount = 100, 
  colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#FF9FF3", "#54A0FF"],
  onComplete 
}: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const createParticle = (index: number): ConfettiParticle => {
    const shapes: ("square" | "circle" | "triangle")[] = ["square", "circle", "triangle"];
    
    return {
      id: index,
      x: Math.random() * window.innerWidth,
      y: -20,
      vx: (Math.random() - 0.5) * 6, // Horizontal velocity
      vy: Math.random() * 3 + 2, // Vertical velocity
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    };
  };

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    
    // Create initial particles
    const initialParticles = Array.from({ length: particleCount }, (_, i) => createParticle(i));
    setParticles(initialParticles);

    // Animation loop
    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed > duration) {
        setParticles([]);
        setIsAnimating(false);
        onComplete?.();
        return;
      }

      setParticles(prevParticles => 
        prevParticles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.2, // Gravity
            rotation: particle.rotation + particle.rotationSpeed
          }))
          .filter(particle => particle.y < window.innerHeight + 50) // Remove particles that fall off screen
      );

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isActive, duration, particleCount, colors, onComplete]);

  if (!isAnimating || particles.length === 0) return null;

  const ParticleShape = ({ particle }: { particle: ConfettiParticle }) => {
    const baseStyle = {
      position: "absolute" as const,
      left: `${particle.x}px`,
      top: `${particle.y}px`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      backgroundColor: particle.color,
      transform: `rotate(${particle.rotation}deg)`,
      pointerEvents: "none" as const,
    };

    switch (particle.shape) {
      case "circle":
        return (
          <div
            style={{
              ...baseStyle,
              borderRadius: "50%",
            }}
          />
        );
      case "triangle":
        return (
          <div
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              backgroundColor: "transparent",
              borderLeft: `${particle.size / 2}px solid transparent`,
              borderRight: `${particle.size / 2}px solid transparent`,
              borderBottom: `${particle.size}px solid ${particle.color}`,
            }}
          />
        );
      default: // square
        return <div style={baseStyle} />;
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ overflow: "hidden" }}
    >
      {particles.map(particle => (
        <ParticleShape key={particle.id} particle={particle} />
      ))}
    </div>,
    document.body
  );
}

// Different celebration styles for different achievement tiers
export function BronzeConfetti(props: Omit<ConfettiProps, "colors">) {
  return (
    <Confetti
      {...props}
      colors={["#CD7F32", "#D2691E", "#B87333", "#A0522D"]}
      particleCount={50}
    />
  );
}

export function SilverConfetti(props: Omit<ConfettiProps, "colors">) {
  return (
    <Confetti
      {...props}
      colors={["#C0C0C0", "#A8A8A8", "#D3D3D3", "#E5E5E5"]}
      particleCount={75}
    />
  );
}

export function GoldConfetti(props: Omit<ConfettiProps, "colors">) {
  return (
    <Confetti
      {...props}
      colors={["#FFD700", "#FFA500", "#FFFF00", "#DAA520"]}
      particleCount={100}
    />
  );
}

export function PlatinumConfetti(props: Omit<ConfettiProps, "colors">) {
  return (
    <Confetti
      {...props}
      colors={["#E5E4E2", "#FFFFFF", "#C0C0C0", "#BCC6CC", "#98FB98"]}
      particleCount={150}
      duration={5000}
    />
  );
}