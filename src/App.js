import React, { useEffect, useState, useRef } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("https://snowychat-server.herokuapp.com");

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccpected, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const selfVideo = useRef();
  const otherVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        setStream(stream);
        selfVideo.current.srcObject = stream;
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setCallAccepted(false);
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
      console.log("Someone is calling....");
    });
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });

    peer.on("stream", (stream) => {
      otherVideo.current.srcObject = stream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal = signal;
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      otherVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Voice Chat App By <code>Snowy</code>
        </p>

        <div className="video-container">
          <div className="video">
            {stream && (
              <video
                playsInline
                muted
                ref={selfVideo}
                autoPlay
                style={{ width: "300px" }}
              />
            )}
          </div>
          <div className="video">
            {callAccpected && !callEnded ? (
              <video
                playsInline
                ref={otherVideo}
                autoPlay
                style={{ width: "300px" }}
              />
            ) : null}
          </div>
        </div>

        <input
          id="filled-basic"
          label="Name"
          variant="filled"
          value={name}
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
          className="input-m"
          style={{ marginBottom: "20px" }}
        />
        <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
          <button
            className="btn answer-btn"
            variant="contained"
            color="primary"
          >
            Copy ID
          </button>
        </CopyToClipboard>

        <div className="group">
          <div className="call-button">
            {callAccpected && !callEnded ? (
              <button className="btn btn-call" onClick={leaveCall}>
                End Call
              </button>
            ) : (
              <>
                <label className="inline-m" for="reciverName">
                  Wanna call someone?
                </label>
                <input
                  className="inline-m input-m"
                  id="reciverName"
                  name="reciverName"
                  label="ID to call"
                  variant="filled"
                  value={idToCall}
                  onChange={(e) => setIdToCall(e.target.value)}
                />
                <button
                  className="btn call-btn"
                  aria-label="call"
                  onClick={() => callUser(idToCall)}
                >
                  Call
                </button>
              </>
            )}
            {idToCall}
          </div>
        </div>

        <div>
          {receivingCall && !callAccpected ? (
            <div className="notification-box">
              <div className="notification-box__title">
                {name} is calling you:
              </div>
              <div className="notification-box__content">
                <button className="btn answer-btn" onClick={answerCall}>
                  Accept
                </button>
                <button className="btn call-btn">Hang up</button>
              </div>
            </div>
          ) : (
            "No one is calling you right now!"
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
