export function extractVideoFrame(file: File, position: 'start' | 'end'): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let done = false;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    const fail = (message: string) => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error(message));
    };

    const timer = window.setTimeout(() => fail('Video frame extraction timed out.'), 15000);

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    video.onerror = () => {
      window.clearTimeout(timer);
      fail('Could not read one of the uploaded videos.');
    };

    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration)) {
        window.clearTimeout(timer);
        fail('Video duration could not be determined.');
        return;
      }
      video.currentTime = position === 'start' ? Math.min(0.05, video.duration / 2) : Math.max(video.duration - 0.05, 0);
    };

    video.onseeked = () => {
      if (done) return;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        window.clearTimeout(timer);
        fail('Could not create a frame canvas.');
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      done = true;
      window.clearTimeout(timer);
      const dataUrl = canvas.toDataURL('image/png');
      cleanup();
      resolve(dataUrl);
    };
  });
}
