import { useState } from "react";
import Home from "./Home";
import { ToastContainer } from "react-toastify";
import Video from "./Video";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video" element={<Video />} />
        </Routes>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          theme="colored"
        />
      </Router>
    </>
  );
}

export default App;
