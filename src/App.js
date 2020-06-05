import React, { Component } from 'react';
import * as S from 'semantic-ui-react'
import './App.css';

const CFG_KEY = 'cfgv1';

class App extends Component {

  constructor(props) {
    super(props);
    let cfg;
    if (!localStorage.getItem(CFG_KEY)) {
      cfg = {
        name: null,
        email: null
      };
    } else {
      cfg = JSON.parse(localStorage.getItem(CFG_KEY))
    }
    this.state = {
      streaming: false,
      sock: false,
      settings: !cfg.name,
      name: cfg.name,
      email: cfg.email
    }
    this.playerRef = React.createRef();
  }

  componentDidMount() {
    this.setupSocket();
    this.saveCfg();
  }

  saveCfg() {
    let { name, email } = this.state;
    localStorage.setItem(CFG_KEY, JSON.stringify({
      name, email
    }));
  }

  setupSocket() {
    let secure = ('https:' == window.location.protocol);
    let sockProto = (secure ? 'wss://' : 'ws://');
    this.socket = window.io.connect(sockProto + window.location.host, { secure: secure });
    this.socket.on('start', () => {
      this.setState({ sock: true });
    });
    this.socket.on('disconnect', () => {
      this.setState({ sock: false });
    })
  }

  async startStream() {
    let constraints = {
      audio: true,
      video: { facingMode: "environment" }
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
    this.socket.emit('start', localStorage.getItem(CFG_KEY));
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
    let { streaming, sock, settings } = this.state;
    return (
      <div className="App">
        {sock ?
          <S.Label style={styles.connLabel} as='a' content='Connected' icon='wifi' /> :
          <S.Label style={styles.connOffLabel} as='a' content='Offline' icon='wifi' />}
        <video style={{ display: streaming ? 'block' : 'hidden' }} muted={true} ref={this.playerRef}></video>
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
        <S.Modal open={settings}>
          <S.Modal.Content>
            <S.Modal.Description>
              <S.Form>
                <S.Form.Field>
                  <label>Name</label>
                  <input onChange={(evt) => this.setState({ name: evt.target.value })} placeholder='' />
                </S.Form.Field>
                <S.Form.Field>
                  <label>Email</label>
                  <input onChange={(evt) => this.setState({ email: evt.target.value })} placeholder='' />
                </S.Form.Field>
                <S.Button color='blue' onClick={() => {
                  this.setState({ settings: false });
                  this.saveCfg();
                }} type='submit'>Save</S.Button>
              </S.Form>
            </S.Modal.Description>
          </S.Modal.Content>
        </S.Modal>
      </div>
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
  connLabel: { zIndex: 99, position: 'absolute', backgroundColor: 'unset', color: 'green' },
  connOffLabel: { zIndex: 99, position: 'absolute', backgroundColor: 'unset', color: 'red' }
};

export default App;
