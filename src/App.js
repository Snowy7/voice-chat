import React, { useEffect, useState, useRef } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("http://localhost:5000");

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccpected, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [myname, setMyName] = useState("");
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
        name: myname,
      });
    });

    peer.on("stream", (stream) => {
      otherVideo.current.srcObject = stream;
    });

    socket.on("callAccepted", (data) => {
      setCallAccepted(true);
      peer.signal = data.signal;
      setName(data.me);
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
      socket.emit("answerCall", { signal: data, to: caller, me: myname });
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
    connectionRef.current = null;
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

        <group>
          <input
            id="filled-basic"
            label="Name"
            variant="filled"
            value={myname}
            placeholder="Enter your name"
            onChange={(e) => setMyName(e.target.value)}
            className="input-m"
            style={{ marginBottom: "20px" }}
          />
          <CopyToClipboard
            text={me}
            style={{ display: "inline", marginBottom: "2rem" }}
          >
            <button
              className="inline-m btn answer-btn"
              variant="contained"
              color="primary"
            >
              Copy ID
            </button>
          </CopyToClipboard>
        </group>

        <div className="group">
          <div className="call-button">
            {callAccpected && !callEnded ? (
              <button className="btn call-btn" onClick={leaveCall}>
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
                  placeholder="Enter Someone's Id to call"
                  label="ID to call" // some test thihngs going in here i am testing it with someone okay???
                  // hopefully it is clear enough for you to get it
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
            {/* {idToCall} */}
          </div>
        </div>

        <div>
          {receivingCall && !callAccpected ? (
            <div className="notification-box">
              <div className="inline notification-box__title">
                {name} is calling you:
              </div>
              <div className="inlin notification-box__content">
                <button className="btn answer-btn" onClick={answerCall}>
                  Accept
                </button>
                <button className="btn call-btn">Hang up</button>
              </div>
            </div>
          ) : callAccpected && !callEnded ? (
            <div className="notification-box">In Call with {name} :)</div>
          ) : (
            <div className="notification-box">
              Everything seems quite for now :)
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
//some play around does work sometime so try it it is good LOL :D :) :p ;P (;
