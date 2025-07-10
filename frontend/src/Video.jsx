import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:9000");

function Video() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, roomId } = location.state || {};
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const [peers, setPeers] = useState([]);
  const peerRef = useRef([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    const getStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("✅ Got local stream:", stream);

        localVideoRef.current.srcObject = stream;
        streamRef.current = stream;

        socket.emit("join-room", { roomId, userName });
        console.log("📤 Emitted join-room", { roomId, userName });

        socket.on("all-users", (usersData) => {
          console.log("📥 Received all-users:", usersData);
          const peerArray = [];

          usersData.forEach(({ userId, userName }) => {
            console.log(
              `🔧 Creating peer as initiator for: ${userName} (${userId})`
            );
            const peer = createPeer(userId, socket.id, stream, userName);

            peerRef.current.push({ peerId: userId, peer, userName });
            peerArray.push({ peerId: userId, peer, userName });
          });

          setPeers(peerArray);
        });

        socket.on("user-joined", ({ userId, userName: newUserName }) => {
          console.log(`👋 User joined: ${newUserName} (${userId})`);

          const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: streamRef.current,
          });

          peer.on("signal", (signal) => {
            console.log("📤 Sending signal (answer) to:", userId);
            socket.emit("signal", {
              to: userId,
              from: socket.id,
              signal,
            });
          });

          peerRef.current.push({
            peerId: userId,
            peer,
            userName: newUserName,
          });

          setPeers((users) => [
            ...users,
            { peerId: userId, peer, userName: newUserName },
          ]);
        });

        socket.on("signal", ({ from, signal }) => {
          console.log("📥 Received signal from:", from);
          const isItem = peerRef.current.find((p) => p.peerId === from);
          if (isItem) {
            console.log("✅ Found matching peer. Passing signal...");
            isItem.peer.signal(signal);
          } else {
            console.warn("⚠️ No matching peer found for:", from);
          }
        });
      } catch (err) {
        console.error("❌ Error in getting stream", err);
      }
    };

    getStream();
    return () => {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
    };
  }, []);

  function createPeer(otherUserID, userId, stream, otherUserName) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      console.log("📤 Sending signal (offer) to:", otherUserID);
      socket.emit("signal", { to: otherUserID, from: userId, signal });
    });

    return peer;
  }

  const toggleMic = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Room: {roomId}</h2>
      <h4>{userName} (You)</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "320px",
              height: "240px",
              border: "3px solid green",
              borderRadius: "12px",
              backgroundColor: "black",
            }}
          />
          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <button  onClick={toggleMic} style={{borderRadius:"6px"}}>
              {micOn ? "Mute Mic " : "Unmute Mic "}
            </button>
            <button onClick={toggleCam} style={{borderRadius:"6px"}}>
              {camOn ? "Turn Off Camera " : "Turn On Camera "}
            </button>
          </div>
        </div>

        {peers.map(({ peer, peerId, userName }) => (
          <RemoteVideo key={peerId} peer={peer} userName={userName} />
        ))}
      </div>
    </div>
  );
}

function RemoteVideo({ peer, userName }) {
  const remoteVideo = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      console.log("📽️ Remote stream received from:", userName, stream);
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div style={{ textAlign: "center" }}>
      <h4>{userName}</h4>
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        style={{ width: 300, border: "2px solid blue", borderRadius: 10 }}
      />
    </div>
  );
}

export default Video;
