import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number; // depth layer (0.2 = far away, 1.0 = near)
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  hasSpikes?: boolean;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  pulsePhase: number;
  pulseSpeed: number;
}

export function UniverseBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for cosmic parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetParallaxX = (mouseX / width - 0.5) * 35;
      targetParallaxY = (mouseY / height - 0.5) * 35;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize with DPR
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initUniverse();
    };
    window.addEventListener('resize', handleResize);

    // Star palettes (white, warm solar amber, cosmic cyan, soft celestial gold)
    const STAR_COLORS = [
      '#ffffff',
      '#ffffff',
      '#f8fafc',
      '#ffedd5', // warm solar white
      '#fed7aa', // amber
      '#fba74c', // deep warm star
      '#bae6fd', // light cyan
      '#e0e7ff', // celestial indigo
    ];

    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let nebulae: NebulaCloud[] = [];

    // Initialize Universe Elements
    function initUniverse() {
      // Stars (density based on viewport area)
      const starCount = Math.min(Math.floor((width * height) / 4500), 240);
      stars = [];

      for (let i = 0; i < starCount; i++) {
        const z = Math.random() * 0.85 + 0.15; // 0.15 to 1.0
        const radius = (Math.random() * 1.5 + 0.4) * z;
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        const hasSpikes = z > 0.8 && Math.random() < 0.15; // only large foreground stars have diffraction spikes

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          radius,
          baseAlpha: Math.random() * 0.6 + 0.35,
          twinkleSpeed: Math.random() * 0.04 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
          hasSpikes,
        });
      }

      // Cosmic Nebulae (soft ambient glowing cosmic dust pockets)
      nebulae = [
        {
          x: width * 0.15,
          y: height * 0.25,
          radius: Math.min(width, height) * 0.45,
          color: 'rgba(234, 88, 12, 0.05)', // warm orange cosmic dust
          vx: 0.02,
          vy: 0.015,
          pulsePhase: 0,
          pulseSpeed: 0.008,
        },
        {
          x: width * 0.85,
          y: height * 0.35,
          radius: Math.min(width, height) * 0.5,
          color: 'rgba(249, 115, 22, 0.04)', // amber celestial halo
          vx: -0.015,
          vy: 0.02,
          pulsePhase: Math.PI / 2,
          pulseSpeed: 0.007,
        },
        {
          x: width * 0.5,
          y: height * 0.8,
          radius: Math.min(width, height) * 0.55,
          color: 'rgba(124, 58, 237, 0.04)', // deep violet nebula
          vx: 0.01,
          vy: -0.015,
          pulsePhase: Math.PI,
          pulseSpeed: 0.006,
        },
        {
          x: width * 0.7,
          y: height * 0.75,
          radius: Math.min(width, height) * 0.35,
          color: 'rgba(251, 146, 60, 0.035)', // solar glow
          vx: -0.01,
          vy: -0.01,
          pulsePhase: Math.PI * 1.5,
          pulseSpeed: 0.009,
        },
      ];
    }

    initUniverse();

    // Spawn Meteor
    let lastMeteorTime = Date.now();
    let nextMeteorInterval = Math.random() * 3000 + 2000; // every 2-5s

    function maybeSpawnMeteor(now: number) {
      if (now - lastMeteorTime > nextMeteorInterval) {
        lastMeteorTime = now;
        nextMeteorInterval = Math.random() * 4000 + 2500;

        // Angle between 25 and 45 degrees
        const angle = (Math.PI / 180) * (Math.random() * 25 + 25);
        const startX = Math.random() * (width * 0.85);
        const startY = Math.random() * (height * 0.4);

        meteors.push({
          x: startX,
          y: startY,
          length: Math.random() * 80 + 70,
          speed: Math.random() * 7 + 9,
          angle,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 35 + 30,
          color: Math.random() > 0.3 ? '#ffedd5' : '#fed7aa',
        });
      }
    }

    let universeClock = 0;

    // Render loop
    function render() {
      if (!ctx) return;
      const now = Date.now();
      universeClock += 0.01;

      // Parallax smooth interpolation
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

      // 1. Deep Space Void Background
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, width, height);

      // 2. Cosmic Ambient Radial Glow
      const centerGrad = ctx.createRadialGradient(
        width * 0.5 + currentParallaxX * 0.5,
        height * 0.45 + currentParallaxY * 0.5,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      centerGrad.addColorStop(0, 'rgba(15, 23, 42, 0.8)'); // deep slate cosmic core
      centerGrad.addColorStop(0.5, 'rgba(10, 15, 29, 0.9)');
      centerGrad.addColorStop(1, 'rgba(3, 5, 12, 1)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Render Drifting Nebulae Clouds
      nebulae.forEach((neb) => {
        neb.x += neb.vx;
        neb.y += neb.vy;
        neb.pulsePhase += neb.pulseSpeed;

        // Wrap around screen gently
        if (neb.x < -neb.radius) neb.x = width + neb.radius;
        if (neb.x > width + neb.radius) neb.x = -neb.radius;
        if (neb.y < -neb.radius) neb.y = height + neb.radius;
        if (neb.y > height + neb.radius) neb.y = -neb.radius;

        const currentRadius =
          neb.radius * (1 + Math.sin(neb.pulsePhase) * 0.08);

        const nebGrad = ctx.createRadialGradient(
          neb.x + currentParallaxX * 0.3,
          neb.y + currentParallaxY * 0.3,
          0,
          neb.x + currentParallaxX * 0.3,
          neb.y + currentParallaxY * 0.3,
          currentRadius
        );
        nebGrad.addColorStop(0, neb.color);
        nebGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = nebGrad;
        ctx.beginPath();
        ctx.arc(
          neb.x + currentParallaxX * 0.3,
          neb.y + currentParallaxY * 0.3,
          currentRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // 4. Universe Model: Armillary / Celestial Orbital Rings
      const centerX = width * 0.5 + currentParallaxX * 0.2;
      const centerY = height * 0.48 + currentParallaxY * 0.2;
      const baseModelRadius = Math.min(width, height) * 0.42;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Ring 1: Celestial Equator (inclined ellipse)
      ctx.save();
      ctx.rotate(universeClock * 0.08);
      ctx.beginPath();
      ctx.ellipse(0, 0, baseModelRadius, baseModelRadius * 0.42, 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.045)'; // subtle cosmic orange line
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12]);
      ctx.stroke();

      // Orbital planetary/celestial node
      const nodeX = Math.cos(universeClock * 0.2) * baseModelRadius;
      const nodeY = Math.sin(universeClock * 0.2) * (baseModelRadius * 0.42);
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.4)';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      // Ring 2: Ecliptic Universe Ring (tilted opposite)
      ctx.save();
      ctx.rotate(-universeClock * 0.05 + 1.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, baseModelRadius * 1.22, baseModelRadius * 0.36, -0.35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'; // faint celestial orbit
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 16]);
      ctx.stroke();

      // Faint outer armillary ring
      ctx.beginPath();
      ctx.arc(0, 0, baseModelRadius * 1.35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.025)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 24]);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // 5. Constellation Lines between nearby stars
      ctx.lineWidth = 0.6;
      for (let i = 0; i < stars.length; i++) {
        const s1 = stars[i];
        if (s1.z < 0.5) continue; // only connect mid-to-foreground stars

        const x1 = s1.x + currentParallaxX * s1.z;
        const y1 = s1.y + currentParallaxY * s1.z;

        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          if (s2.z < 0.5) continue;

          const x2 = s2.x + currentParallaxX * s2.z;
          const y2 = s2.y + currentParallaxY * s2.z;

          const dx = x1 - x2;
          const dy = y1 - y2;
          const distSq = dx * dx + dy * dy;
          const maxDist = 80;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.12 * Math.min(s1.z, s2.z);
            ctx.strokeStyle = `rgba(251, 146, 60, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // 6. Render Stars
      stars.forEach((star) => {
        // Twinkle factor
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase);
        const currentAlpha = Math.max(
          0.1,
          Math.min(1, star.baseAlpha + twinkle * 0.35)
        );

        // Position with 3D parallax depth
        const sx = star.x + currentParallaxX * star.z;
        const sy = star.y + currentParallaxY * star.z;

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = star.color;

        // Subtle glow for brighter stars
        if (star.z > 0.7) {
          ctx.shadowColor = star.color;
          ctx.shadowBlur = 4;
        }

        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Diffraction spikes on prominent stars
        if (star.hasSpikes && currentAlpha > 0.6) {
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.5;
          const spikeLen = star.radius * 3.5;
          ctx.beginPath();
          ctx.moveTo(sx - spikeLen, sy);
          ctx.lineTo(sx + spikeLen, sy);
          ctx.moveTo(sx, sy - spikeLen);
          ctx.lineTo(sx, sy + spikeLen);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 7. Render Meteors / Shooting Stars
      maybeSpawnMeteor(now);

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life++;
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;

        const progress = m.life / m.maxLife;
        m.alpha = 1 - progress;

        if (m.life >= m.maxLife || m.x > width + 100 || m.y > height + 100) {
          meteors.splice(i, 1);
          continue;
        }

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        meteorGrad.addColorStop(0.7, `rgba(249, 115, 22, ${m.alpha * 0.4})`);
        meteorGrad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

        ctx.save();
        ctx.strokeStyle = meteorGrad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Glowing meteor head
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {/* Subtle top vignette and bottom atmospheric boundary */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_0%] from-transparent via-transparent to-black/40 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-neutral-950/60 to-transparent pointer-events-none" />
    </div>
  );
}
