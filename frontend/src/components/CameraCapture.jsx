import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ReplayIcon from '@mui/icons-material/Replay';

// Live camera preview + single-frame capture. No file-upload fallback by design.
export default function CameraCapture({ onCapture, captured }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setReady(true);
        }
      } catch (err) {
        setError('Camera access was denied or is unavailable. Please allow camera permission to continue.');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.85));
  };

  if (captured) {
    return (
      <Stack alignItems="center" spacing={1}>
        <Box component="img" src={captured} alt="Captured selfie" sx={{ width: 260, borderRadius: 2, border: '1px solid #ddd' }} />
        <Button startIcon={<ReplayIcon />} onClick={() => onCapture(null)} size="small">
          Retake
        </Button>
      </Stack>
    );
  }

  return (
    <Stack alignItems="center" spacing={1}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        playsInline
        muted
        sx={{ width: 260, height: 195, borderRadius: 2, background: '#111', objectFit: 'cover', transform: 'scaleX(-1)' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Button variant="contained" startIcon={<CameraAltIcon />} disabled={!ready} onClick={capture}>
        Capture Selfie
      </Button>
      {!error && !ready && <Typography variant="caption">Waiting for camera permission…</Typography>}
    </Stack>
  );
}
