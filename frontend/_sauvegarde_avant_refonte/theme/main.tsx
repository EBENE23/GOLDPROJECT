import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { ToastContainer } from "react-toastify";

import App from "./App";

import "./index.css";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Respecte le réglage « réduire les animations » du système. */}
      <MotionConfig reducedMotion="user">
        <App />

        <ToastContainer
          position="top-center"
          autoClose={4500}
          limit={3}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          theme="light"
        />
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);