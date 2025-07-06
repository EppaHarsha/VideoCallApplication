import React, { useEffect } from "react";
import { useState, useRef } from "react";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const socket = io("http://localhost:9000");
function Video() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, roomId } = location.state || {};
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const remoteSocketId = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const isRemoteDescriptionSet = useRef(false);

  useEffect(() => {
    if (!userName && !roomId) {
      navigate("/");
      return;
    }
    socket.emit("join-room", { roomId });
    console.log(`user joined in room ${roomId}`);

    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    const getUserMedia = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = localStream;

        console.log("🎥 Got local stream:", localStream);

        localStream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, localStream);
        });
      } catch (err) {
        toast.error("Failed to access media", err);
      }
    };
    getUserMedia();

    socket.on("all-users", async (users) => {
      if (users.length > 0) {
        const to = users[0];
        remoteSocketId.current = to;

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit("offer", { offer, to });
      }
    });

    socket.on("offer-receive", async ({ offer, from }) => {
      remoteSocketId.current = from;
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      isRemoteDescriptionSet.current = true;
      while (iceCandidatesQueue.current.length) {
        const candidate = iceCandidatesQueue.current.shift();
        await peerConnection.current.addIceCandidate(candidate);
      }

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", { answer, to: from });
    });

    socket.on("answer-receive", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      while (iceCandidatesQueue.current.length) {
        const candidate = iceCandidatesQueue.current.shift();
        await peerConnection.current.addIceCandidate(candidate);
      }
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteSocketId.current,
        });
      }
    };

    socket.on("ice-candidate", async ({ candidate }) => {
      const iceCandidate = new RTCIceCandidate(candidate);
      if (isRemoteDescriptionSet.current) {
        try {
          await peerConnection.current.addIceCandidate(iceCandidate);
          console.log(" ICE candidate added");
        } catch (err) {
          console.error(" ICE add failed", err);
        }
      } else {
        console.log(" Queued ICE candidate");
        iceCandidatesQueue.current.push(iceCandidate);
      }
    });

    peerConnection.current.ontrack = (event) => {
      console.log("data is coming on track");
      console.log("📺 Remote stream received:", event.streams[0]);

      remoteVideoRef.current.srcObject = event.streams[0];
    };

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.disconnect();
    };
  }, [userName, roomId]);

  return (
    <>
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <h2>Room: {roomId}</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{
              marginTop: 80,
              width: 300,
              height: 300,
              border: "2px solid black",
            }}
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            style={{
              marginTop: 80,
              width: 300,
              height: 300,
              border: "2px solid black",
            }}
          />
        </div>
        <div style={{ marginTop: "20px" }}>
          {/* <button onClick={leaveCall}>❌ Leave Call</button> */}
        </div>
      </div>
    </>
  );
}

export default Video;
