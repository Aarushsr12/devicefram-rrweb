import React, { useState } from "react";
import LoginPage from "./loginPage";
import * as rrweb from "rrweb";

function App() {
  const [events, setEvents] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [stopRecordingFunc, setStopRecordingFunc] = useState(null);

  const startRecording = () => {
    if (!isRecording) {
      const stopFunc = rrweb.record({
        emit(event) {
          const transformedEvent = transformEvent(event);
          if (transformedEvent) {
            setEvents((prevEvents) => [...prevEvents, transformedEvent]);
          }
        },
        maskAllInputs: true,
        recordCanvas: false,
        ignoreClass: 'ignore',
        inlineStylesheet: false,
        collectFonts: false,
      });
      setStopRecordingFunc(() => stopFunc);
      setIsRecording(true);
      console.log("Recording started.");
    }
  };

  const transformEvent = (event) => {
    // Custom transformation for each event type
    const timestamp = Date.now();
    switch (event.type) {
      case 2: // Mouse event
        if (event.data.source === 2) { // Check for click event
          return {
            type: "click",
            timestamp,
            description: `Mouse click at (${event.data.x}, ${event.data.y})`,
            locator: event.data.target,
            coordinates: { x: event.data.x, y: event.data.y },
          };
        }
        break;
      case 3: // Input event
        return {
          type: "input",
          timestamp,
          description: `User input in element ${event.data.target}`,
          locator: event.data.target,
          value: event.data.text,
        };
      case 4: // Scroll event
        const targetElement = rrweb.record.mirror.getNode(event.id);
        const x = event.data?.x || targetElement?.scrollLeft || 0;
        const y = event.data?.y || targetElement?.scrollTop || 0;
        return {
          type: "scroll",
          timestamp,
          description: `Scroll to (${x}, ${y})`,
          position: { x, y },
        };
      default:
        return null;
    }
  };

  const stopAndLogRecording = () => {
    if (isRecording && stopRecordingFunc) {
      stopRecordingFunc();
      setIsRecording(false);
      setStopRecordingFunc(null);

      console.log("Recorded custom events:", events);

      setTimeout(() => {
        const jsonContent = JSON.stringify({ events });
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "login_events.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      }, 100);
    }
  };

  return (
    <div className="App">
      <div>
        <LoginPage />
      </div>
      <div>
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopAndLogRecording} disabled={!isRecording}>
          Stop Recording & Save
        </button>
      </div>
    </div>
  );
}

export default App;
