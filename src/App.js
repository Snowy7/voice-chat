import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Video = styled.video`
  border: 1px solid blue;
  width: 50%;
  height: 50%;
`;

function App() {
  const [yourID, setYourID] = useState("");
  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io.connect("http://localhost:8000");
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      });

    socket.current.on("yourID", (id) => {
      setYourID(id);
    });
    socket.current.on("allUsers", (users) => {
      setUsers(users);
    });

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
  }, []);

  function callPeer(id) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "stun:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
          {
            urls: "turn:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
        ],
      },
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: yourID,
      });
    });

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  }

  function acceptCall() {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.current.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  let UserVideo;
  if (stream) {
    UserVideo = <Video playsInline muted ref={userVideo} autoPlay />;
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = <Video playsInline ref={partnerVideo} autoPlay />;
  }

  let incomingCall;
  if (receivingCall) {
    incomingCall = (
      <div>
        <h1>{caller} is calling you</h1>
        <button onClick={acceptCall}>Accept</button>
      </div>
    );
  }
  return (
    <div className="App">
      <header className="App-header">
        <div className="container">
          <div className="sidebar">
            {Object.keys(users).map((key) => {
              if (key === yourID) {
                return null;
              }
              return (
                <div className="user">
                  <div className="name">{key}</div>
                  <button
                    className="btn call-btn"
                    aria-label="call"
                    onClick={() => callPeer(key)}
                  >
                    Call
                  </button>
                </div>
              );
            })}
          </div>
          <div className="content">
            <p>
              Voice Chat App By <code>Snowy</code>
            </p>
            <br />
            <p>Your ID: {yourID}</p>

            <div className="video-container">
              {UserVideo}
              {PartnerVideo}
            </div>
            {receivingCall && !callAccepted ? (
              <div className="notification-box">
                <div className="inline notification-box__title">
                  {caller} is calling you:
                </div>
                <div className="inlin notification-box__content">
                  <button className="btn answer-btn" onClick={acceptCall}>
                    Accept
                  </button>
                  <button className="btn call-btn">Hang up</button>
                </div>
              </div>
            ) : callAccepted ? (
              <div className="notification-box">
                You are in a call with {caller}
              </div>
            ) : (
              <div className="notification-box">
                Everything seems quite for now :)
              </div>
            )}
          </div>
        </div>
        {/* <div className="group">
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
        </div> */}

        {/* <div>
          {receivingCall ? (
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
          ) : (
            <div className="notification-box">
              Everything seems quite for now :)
            </div>
          )}
        </div> */}
      </header>
    </div>
  );
  //   <Container>
  //     <Row>
  //       {UserVideo}
  //       {PartnerVideo}
  //     </Row>
  //     <Row>
  //       {Object.keys(users).map((key) => {
  //         if (key === yourID) {
  //           return null;
  //         }
  //         return <button onClick={() => callPeer(key)}>Call {key}</button>;
  //       })}
  //     </Row>
  //     <Row>{incomingCall}</Row>
  //   </Container>
  // );
}

export default App;
