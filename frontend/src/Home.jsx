import React from "react";
import { useState } from "react";
import "./Home.css";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Home() {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const joinVideo = () => {
    if (userName && roomId) {
      toast.success("Joining the room....");
      navigate("/video", {
        state: { userName: userName, roomId: roomId },
      });
    } else {
      toast.error("please enter both UserName and RoomId");
    }
  };

  return (
    <div className="app-container">
      <h1 className="heading">Video Call Application</h1>
      <input
        className="input"
        type="text"
        placeholder="Enter username..."
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <input
        className="input"
        type="text"
        placeholder="Enter room id..."
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && joinVideo()}
      />
      <button className="btn-hme" onClick={joinVideo}>
        Join
      </button>
    </div>
  );
}

export default Home;
