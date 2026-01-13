function SimulatorCard({ children, simScore }) {
  const [style, setStyle] = useState({});
  const [glowStyle, setGlowStyle] = useState({});

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
    const rotateY = ((x - centerX) / centerX) * 5;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: "none",
    });

    setGlowStyle({
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(168, 85, 247, 0.15) 0%, transparent 80%)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 0.5s ease-out",
    });
    setGlowStyle({ opacity: 0 });
  };

  return (
    <div
      className="relative transition-transform duration-200 ease-out will-change-transform"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none rounded-[2.5rem] transition-opacity duration-300"
        style={glowStyle}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
