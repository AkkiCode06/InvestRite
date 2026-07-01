import { useEffect, useRef } from 'react';

// Direct MP4 — no HLS needed for this CloudFront source
const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4';

export default function BackgroundVideo() {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (v) {
      v.src = VIDEO_URL;
      v.play().catch(() => {});
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* No overlay — video at full opacity as specified */}
      <video
        ref={ref}
        muted loop playsInline autoPlay
        className="w-full h-full object-cover"
        style={{ minHeight: '100vh' }}
      />
    </div>
  );
}
