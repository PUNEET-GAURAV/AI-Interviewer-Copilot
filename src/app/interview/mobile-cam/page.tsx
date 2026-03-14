'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function MobileCamContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (!roomId) {
      setError('Invalid pairing link. No room ID found.');
      setStatus('');
      return;
    }

    let localStream: MediaStream | null = null;
    let peerInstance: any = null;

    const startStreaming = async () => {
      try {
        setStatus('Requesting camera access...');
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, // Front camera
          audio: false 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        setStatus('Connecting to desktop...');
        
        // Dynamically import peerjs to avoid SSR issues
        const { default: Peer } = await import('peerjs');
        const peer = new Peer();
        peerInstance = peer;

        peer.on('open', (id) => {
          setStatus('Pairing with desktop...');
          const call = peer.call(roomId, localStream as MediaStream);
          
          call.on('stream', () => {
            // Desktop might stream back, but we don't care
          });

          call.on('close', () => {
            setStatus('Connection closed by desktop.');
          });
          
          // If the call was successfully initiated
          setStatus('Connected! Streaming to desktop.');
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setError(`Connection error: ${err.message}`);
          setStatus('');
        });

      } catch (err: any) {
        console.error('Mobile Cam Error:', err);
        setError(`Failed to access camera: ${err.message || 'Permissions denied'}`);
        setStatus('');
      }
    };

    startStreaming();

    return () => {
      localStream?.getTracks().forEach(t => t.stop());
      peerInstance?.destroy();
    };
  }, [roomId]);

  return (
    <div style={{ background: '#0a0a0f', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Secondary Camera</h1>
        
        <div style={{ 
          width: '100%', 
          aspectRatio: '3/4', 
          background: '#1a1a24', 
          borderRadius: 16, 
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20, color: '#ef4444' }}>
              <p>{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />
          )}
        </div>

        {status && (
          <div style={{ 
            padding: '12px 20px', 
            background: status.includes('Connected') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 212, 255, 0.1)', 
            border: `1px solid ${status.includes('Connected') ? '#10b981' : '#00d4ff'}`,
            borderRadius: 12,
            color: status.includes('Connected') ? '#10b981' : '#00d4ff',
            fontWeight: 600,
            fontSize: 14
          }}>
            {status}
          </div>
        )}

        <p style={{ marginTop: 24, fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
          Please position your phone to capture your surroundings. Leave this page open during your interview.
        </p>
      </div>
    </div>
  );
}

export default function MobileCamPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: 'white', textAlign: 'center' }}>Loading...</div>}>
      <MobileCamContent />
    </Suspense>
  );
}
