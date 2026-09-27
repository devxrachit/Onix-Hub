import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

function randomID(len = 5) {
    let result = '';
    const chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP';
    const maxPos = chars.length;

    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return result;
}

const RoomPage = () => {
    const { roomId } = useParams();
    const meetingRef = useRef(null);

    useEffect(() => {
        let zp; // holds the ZegoUIKit instance so cleanup can tear it down
        let cancelled = false; // set on cleanup; guards against StrictMode's mount->unmount->remount race

        const initializeMeeting = async () => {
            console.log("Initializing meeting for room:", roomId);

            if (meetingRef.current && roomId) {
                try {
                    const appID = Number(process.env.REACT_APP_ZEGO_APP_ID);
                    const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET?.trim();

                    if (!appID || !serverSecret) {
                        console.error(
                            "Missing ZEGOCLOUD credentials — set REACT_APP_ZEGO_APP_ID and " +
                            "REACT_APP_ZEGO_SERVER_SECRET in your .env file, then restart `npm start`."
                        );
                        return;
                    }

                    const userID = randomID(8);
                    const userName = "User_" + randomID(4);

                    console.log("Generating token for user:", userName);

                    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                        appID,
                        serverSecret,
                        roomId,
                        userID,
                        userName
                    );

                    // If StrictMode already unmounted us by the time the token
                    // finished generating, bail out before creating an instance
                    // that would never get cleaned up.
                    if (cancelled) return;

                    console.log("Token generated, creating ZegoUIKit instance");

                    const instance = ZegoUIKitPrebuilt.create(kitToken);
                    zp = instance; // assign immediately so cleanup can always find it

                    // Second guard: if unmounted while create() was running,
                    // destroy the instance we just made instead of joining a room.
                    if (cancelled) {
                        instance.destroy();
                        return;
                    }

                    console.log("Joining room...");

                    await instance.joinRoom({
                        container: meetingRef.current,
                        sharedLinks: [
                            {
                                name: 'Personal link',
                                url: window.location.href,
                            },
                        ],
                        scenario: {
                            mode: ZegoUIKitPrebuilt.OneONoneCall,
                        },
                        showScreenSharingButton: true,
                        showTextChat: true,
                        onJoinRoom: () => {
                            console.log("Successfully joined room:", roomId);
                        },
                        onLeaveRoom: () => {
                            console.log("Left room:", roomId);
                        },
                        onUserJoin: (users) => {
                            console.log("User joined:", users);
                        },
                        onUserLeave: (users) => {
                            console.log("User left:", users);
                        }
                    });

                    console.log("Room joined successfully");
                } catch (error) {
                    console.error("Error initializing ZegoCloud:", error);
                }
            } else {
                console.error("Missing meetingRef or roomId", {
                    hasRef: !!meetingRef.current,
                    roomId
                });
            }
        };

        const timer = setTimeout(() => {
            initializeMeeting();
        }, 100);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            zp?.destroy();
        };
    }, [roomId]);

    return (
        <div className="room-page" style={{ width: '100%', height: '100vh' }}>
            <div
                ref={meetingRef}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '500px'
                }}
            />
        </div>
    );
};

export default RoomPage;
