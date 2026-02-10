import React, { useEffect, useRef, useState } from "react";

const ADSENSE_CLIENT = "ca-pub-4686552623767238";
const ADSENSE_SLOT = "1763069341";

const SimpleAdCard = ({
  isDarkMode,
  glassCardStyle,
}: {
  isDarkMode: boolean;
  glassCardStyle: React.CSSProperties;
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    if (!adRef.current) return;

    // Simple timeout to detect if ad loads
    const failTimeout = setTimeout(() => {
      setAdFailed(true);
    }, 5000); // 5 seconds timeout

    try {
      // Create the ad element
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.style.minHeight = "100px";
      ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
      ins.setAttribute("data-ad-slot", ADSENSE_SLOT);
      ins.setAttribute("data-ad-format", "horizontal");
      ins.setAttribute("data-full-width-responsive", "false");

      // Clear and append
      adRef.current.innerHTML = "";
      adRef.current.appendChild(ins);

      // Push the ad
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});

      // Clear timeout if successful
      clearTimeout(failTimeout);
    } catch (error) {
      console.warn("AdSense error:", error);
      clearTimeout(failTimeout);
      setAdFailed(true);
    }

    // Cleanup
    return () => {
      clearTimeout(failTimeout);
    };
  }, []);

  if (adFailed) {
    return null; // Don't show anything if ad fails
  }

  return (
    <div
      style={glassCardStyle}
      className={`mx-2 sm:mx-4 my-4 rounded-2xl overflow-hidden ${
        isDarkMode ? "border border-white/[0.06]" : "border border-black/[0.06]"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">AD</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Sponsored</span>
          </div>
        </div>
        <div
          ref={adRef}
          className="min-h-[100px] flex items-center justify-center"
        >
          <div className="text-xs text-gray-500">Loading advertisement...</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdCard;
