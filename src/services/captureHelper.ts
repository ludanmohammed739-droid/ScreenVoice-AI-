// Ultra-fast lightweight frame grabber for zero-latency screen OCR and questions

export function captureVideoFrame(video: HTMLVideoElement): string | null {
  if (!video || video.readyState < 2) return null;

  try {
    const rawW = video.videoWidth || 640;
    const rawH = video.videoHeight || 480;

    // Downscale to max 640px wide for near-instant upload (< 35KB)
    const scale = Math.min(1, 640 / rawW);
    const width = Math.round(rawW * scale);
    const height = Math.round(rawH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.55);
  } catch (err) {
    console.error('Failed to capture video frame:', err);
    return null;
  }
}

export function generateSandboxFrame(
  question: string,
  options: string[],
  category: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 800;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 640, 800);
  gradient.addColorStop(0, '#090d16');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 640, 800);

  // Card background
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(30, 40, 580, 720, 20);
  ctx.fill();

  // Category pill
  ctx.fillStyle = '#312e81';
  ctx.beginPath();
  ctx.roundRect(50, 60, 180, 40, 12);
  ctx.fill();
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 18px "Cairo", sans-serif';
  ctx.direction = 'rtl';
  ctx.fillText(category, 210, 88);

  // Question Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px "Cairo", sans-serif';
  ctx.direction = 'rtl';

  const words = question.split(' ');
  let line = '';
  let y = 150;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 520 && n > 0) {
      ctx.fillText(line, 580, y);
      line = words[n] + ' ';
      y += 40;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 580, y);

  // Options cards
  let optY = Math.max(y + 40, 320);
  options.forEach((opt) => {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(50, optY, 540, 65, 14);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px "Cairo", sans-serif';
    ctx.direction = 'rtl';
    ctx.fillText(opt, 560, optY + 42);

    optY += 85;
  });

  return canvas.toDataURL('image/jpeg', 0.6);
}
