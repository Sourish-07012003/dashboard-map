import React from "react";
import TimelineSlider from "./components/TimelineSlider";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";

const App: React.FC = () => {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
        <TimelineSlider />
        <div style={{ flex: 1, position: "relative" }}>
          <MapView />
        </div>
      </div>
      <div
        style={{
          flex: 1,
          borderLeft: "1px solid #e8e8e8",
          overflow: "auto",
          minWidth: 320,
        }}
      >
        <Sidebar />
      </div>
    </div>
  );
};

export default App;
