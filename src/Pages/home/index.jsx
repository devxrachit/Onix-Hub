import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const [roomCode, setRoomCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const audioRef = useRef(null);
    const navigate = useNavigate();
    
    const handleFormSubmit = (ev) => {
        ev.preventDefault();
        if (roomCode.trim()) {
            setIsLoading(true);
            // Fade out music before navigation
            if (audioRef.current && audioRef.current.volume !== undefined && !audioRef.current.paused) {
                const originalVolume = audioRef.current.volume;
                const fadeOut = setInterval(() => {
                    if (audioRef.current && audioRef.current.volume > 0.1) {
                        audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.1);
                    } else {
                        clearInterval(fadeOut);
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.volume = originalVolume; // Reset volume for next time
                        }
                    }
                }, 50);
            }
            
            setTimeout(() => {
                navigate(`/room/${roomCode.trim()}`);
            }, 300);
        }
    };

    // Initialize audio element when component mounts
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            // Set initial properties
            audio.volume = 0.3;
            audio.preload = 'metadata';
            
            // Add event listeners for better state management
            const handleLoadedData = () => {
                console.log('Audio loaded successfully');
            };
            
            const handleError = (e) => {
                console.log('Audio loading error:', e);
                setAudioError(true);
            };
            
            audio.addEventListener('loadeddata', handleLoadedData);
            audio.addEventListener('error', handleError);
            
            return () => {
                audio.removeEventListener('loadeddata', handleLoadedData);
                audio.removeEventListener('error', handleError);
            };
        }
    }, []);

    // Handle first user interaction to enable autoplay
    useEffect(() => {
        const handleFirstInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
                // Try to play music after first interaction
                setTimeout(() => {
                    if (audioRef.current && audioRef.current.readyState >= 2) {
                        audioRef.current.play().then(() => {
                            setIsPlaying(true);
                        }).catch((error) => {
                            console.log('Autoplay failed:', error);
                            setIsPlaying(false);
                        });
                    }
                }, 100);
            }
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    }, [hasInteracted]);

    const toggleMusic = () => {
        if (audioRef.current && audioRef.current.readyState >= 2) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch((error) => {
                    console.log('Audio play failed:', error);
                    setIsPlaying(false);
                });
            }
        }
    };

    const toggleMute = () => {
        if (audioRef.current && audioRef.current.muted !== undefined) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e) => {
        if (audioRef.current && audioRef.current.volume !== undefined) {
            audioRef.current.volume = e.target.value / 100;
        }
    };

    return (
        <div className="home-page">
            <div className="home-particles" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
            </div>
        
            {/* Background Music */}
            <audio
                ref={audioRef}
                loop
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                    console.log('Audio error:', e);
                    setAudioError(true);
                }}
                onLoadStart={() => console.log('Audio loading started')}
                onCanPlay={() => console.log('Audio can play')}
            >
                {/* Add your music file here */}
                <source src="/audio/background-music.mp3" type="audio/mpeg" />
                <source src="/audio/background-music.ogg" type="audio/ogg" />
                <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav" />
                Your browser does not support the audio element.
            </audio>

            {/* Music Control Panel - Only show if no audio error */}
            {!audioError && (
                <div className="music-controls">
                    <button 
                        className={`music-btn ${isPlaying ? 'playing' : 'paused'}`}
                        onClick={toggleMusic}
                        title={isPlaying ? 'Pause Music' : 'Play Music'}
                    >
                        {isPlaying ? '⏸️' : '▶️'}
                    </button>
                    
                    <button 
                        className={`music-btn ${isMuted ? 'muted' : 'unmuted'}`}
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                    
                    <div className="volume-control">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="30"
                            onChange={handleVolumeChange}
                            className="volume-slider"
                            title="Volume"
                        />
                    </div>
                </div>
            )}

            {/* Welcome message for first-time visitors */}
            {!hasInteracted && !audioError && (
                <div className="welcome-banner">
                    <p>🎵 Click anywhere to enable background music</p>
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="form">
                <div className="form-group">
                    <h1>ONIX HUB</h1>
                    <p>Connect with anyone, anywhere. Enter a room code to join or create a new video conference.</p>
                    
                    <div className="form-field">
                        <label htmlFor="roomCode">
                            Room Code
                        </label>
                        <input 
                            id="roomCode"
                            value={roomCode} 
                            onChange={(e) => setRoomCode(e.target.value)}
                            type="text" 
                            required 
                            placeholder="Enter room code..."
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="form-button">
                        <button 
                            type="submit" 
                            disabled={isLoading || !roomCode.trim()}
                        >
                            {isLoading ? 'Joining...' : 'Join Room'}
                        </button>
                    </div>
                </div>
            </form>
        </div>  
    );
};

export default HomePage;