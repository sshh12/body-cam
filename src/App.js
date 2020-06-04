import React, { Component } from 'react';
import * as S from 'semantic-ui-react'
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      streaming: false,
      sock: false
    }
    this.playerRef = React.createRef();
  }

  componentDidMount() {
    this.setupSocket();
  }

  setupSocket() {
    this.socket = window.io.connect('ws://' + window.location.host, { secure: false });
    this.socket.on('hb:client', () => {
      this.setState({ sock: true });
    });
    this.socket.on('disconnect', () => {
      this.setState({ sock: false });
    })
  }

  async startStream() {
    let [width, height] = [window.innerWidth, window.innerHeight];
    let constraints = {
      audio: true,
      video: {
        width: { min: width / 20, ideal: width, max: width * 20 },
        height: { min: height / 20, ideal: height, max: height * 20 },
      }
    };
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      alert(err);
    }
    let videoPlayer = this.playerRef.current;
    videoPlayer.srcObject = this.stream;
    videoPlayer.onloadedmetadata = (evt) => {
      videoPlayer.play();
      this.setState({ streaming: true });
    };
    this.socket.emit('start');
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.start(0);
    this.recorder.ondataavailable = (evt) => {
      this.socket.emit('stream', evt.data);
    };
  }

  stopStream() {
    this.setState({ streaming: false });
    this.socket.emit('stop');
    this.recorder.stop();
    this.stream.getVideoTracks()[0].stop();
  }

  render() {
    let { streaming, sock } = this.state;
    return (
      <div className="App">
        {sock ? 
          <S.Label style={styles.connLabel} as='a' content='Connected' icon='wifi' /> :
          <S.Label style={styles.connOffLabel} as='a' content='Offline' icon='wifi' />}
        <video style={{display: streaming ? 'block': 'hidden'}} muted={true} ref={this.playerRef}></video>
        {!streaming && <S.Button 
          style={styles.bigCenterBtn} circular
          disabled={!sock}
          onClick={() => this.startStream()}
          color='red' size='massive' icon='record'></S.Button>}
        {streaming && <S.Button 
          style={styles.bigBottomBtn} circular
          disabled={!sock}
          onClick={() => this.stopStream()}
          color='yellow' size='massive' icon='stop'></S.Button>}
      </div >
    );
  }

}

const styles = {
  bigCenterBtn: {
    zIndex: 99, position: 'absolute',
    top: '50%', left: '50%', marginRight: '-50%', transform: 'translate(-50%, -50%)',
    fontSize: '3rem'
  }, 
  bigBottomBtn: {
    zIndex: 99, position: 'absolute',
    bottom: '5%', left: '50%', marginRight: '-50%', transform: 'translate(-50%, -50%)',
    fontSize: '3rem'
  },
  connLabel: {zIndex: 99, position: 'absolute', backgroundColor: 'unset', color: 'green'},
  connOffLabel: {zIndex: 99, position: 'absolute', backgroundColor: 'unset', color: 'red'}
};

export default App;
