import { useEffect, useRef } from "react";
import gsap from "gsap";
import logo from "../../assets/lagossuya.jpg";

export default function LogoLoader() {
  const logoRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      logoRef.current,
      { opacity: 0.7, scale: 0.96 },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      }
    );
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24">
      {/* Logo */}
      <img
        ref={logoRef}
        src={logo}
        alt="Lagos Suya Spot"
        className="w-40 h-40 rounded-full object-cover shadow-lg mb-4"
      />

      {/* Brand Name */}
      <h2 className="text-lg font-semibold tracking-wide text-gray-800">
        Lagos Suya Spot
      </h2>

      {/* Optional subtitle (remove if not needed) */}
      <p className="text-sm text-gray-500 mt-1">
        Preparing your menu…
      </p>
    </div>
  );
}
