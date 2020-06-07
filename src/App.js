import React, { Component } from 'react';
import * as S from 'semantic-ui-react';
import './App.css';

import Config, { cfg } from './components/Config';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      recording: false,
      sock: true,
      configOpen: !cfg.setup,
      config: cfg,
      processing: false
    }
    this.playerRef = React.createRef();
    this.id = null;
    this.useOfflineBuffer = false;
    this.vidChunks = null;
    this.offlineBuffer = null;
  }

  componentDidMount() {
    this.setupSocket();
  }

  setupSocket() {
    let secure = ('https:' == window.location.protocol);
    let sockProto = (secure ? 'wss://' : 'ws://');
    this.socket = window.io.connect(sockProto + window.location.host, { secure: secure });
    this.socket.on('new', (id) => {
      this.id = id;
      console.log(id);
      this.setState({ sock: true });
      if (this.state.recording) {
        this.patchRecordingOnReconnect();
      } else {
        this.useOfflineBuffer = false;
      }
    });
    this.socket.on('error', (err) => {
      alert('Oh no something went wrong: ' + err);
    });
    this.socket.on('disconnect', () => {
      this.setState({ sock: false });
      this.useOfflineBuffer = true;
    });
    this.socket.on('processing:start', () => {
      this.setState({ processing: true })
    });
    this.socket.on('processing:end', () => {
      this.setState({ processing: false })
    });
  }

  patchRecordingOnReconnect() {
    let { config } = this.state;
    if (config.uploadWhile) {
      this.socket.emit('start', JSON.stringify(config));
      if (this.offlineBuffer.length > 0) {
        let skippedBlob = new Blob(this.offlineBuffer, { type: this.offlineBuffer[0].type });
        // This may be a race condition w/ondataavailable
        this.socket.emit('stream', skippedBlob);
      }
      this.offlineBuffer = [];
    }
    this.useOfflineBuffer = false;
  }

  async startRecording() {
    let { config } = this.state;
    let constraints = {
      audio: true,
      video: { facingMode: 'environment' }
    };
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      alert(err);
    }
    this.vidChunks = [];
    this.offlineBuffer = [];
    let videoPlayer = this.playerRef.current;
    videoPlayer.srcObject = this.stream;
    videoPlayer.onloadedmetadata = (evt) => {
      videoPlayer.play();
      this.setState({ recording: true });
    };
    if (config.uploadWhile) {
      this.socket.emit('start', JSON.stringify(config));
    }
    this.recorder = new MediaRecorder(this.stream, { mimeType: 'video/webm; codecs=vp9' });
    this.recorder.start(0);
    this.recorder.ondataavailable = async (evt) => {
      if (config.uploadWhile) {
        if (this.useOfflineBuffer) {
          this.offlineBuffer.push(evt.data)
        } else {
          this.socket.emit('stream', evt.data);
        }
      }
      if (config.download) {
        this.vidChunks.push(evt.data);
      }
    };
    this.autoStopInterval = setInterval(() => this.stopRecording(), parseInt(config.autoStopMins) * 60 * 1000);
  }

  stopRecording() {
    let { config } = this.state;
    clearInterval(this.autoStopInterval);
    this.setState({ recording: false });
    if (config.uploadWhile) {
      this.socket.emit('stop');
    }
    this.recorder.stop();
    this.stream.getTracks().forEach((track) => track.stop());
    if (config.download) {
      let localUrl = window.URL.createObjectURL(new Blob(this.vidChunks, { type: this.vidChunks[0].type }));
      let a = document.createElement("a");
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = localUrl;
      a.download = 'video.webm';
      a.click();
      window.URL.revokeObjectURL(localUrl);
    }
  }

  renderConnStatus() {
    let { sock, processing } = this.state;
    if (sock) {
      if (processing) {
        return <S.Label style={styles.connProcLabel} as='a' content='Processing' icon='sync' />;
      }
      return <S.Label style={styles.connLabel} as='a' content='Connected' icon='wifi' />;
    }
    return <S.Label style={styles.connOffLabel} as='a' content='Offline' icon='wifi' />;
  }

  render() {
    let { recording, sock, configOpen } = this.state;
    let [width, height] = [window.innerWidth, window.innerHeight];
    return (
      <div className="App">
        {this.renderConnStatus()}
        {!configOpen && !recording &&
          <S.Label style={styles.settingsLabel} as='a' content='' icon='settings' onClick={() => this.setState({ configOpen: true })} />}
        <video style={{ display: recording ? 'block' : 'hidden', height: `${height}px`, width: `${width}px` }} muted={true} ref={this.playerRef}></video>
        {!recording && <S.Button
          style={styles.bigCenterBtn} circular
          disabled={!sock}
          onClick={() => this.startRecording()}
          color='red' size='massive' icon='record'></S.Button>}
        {recording && <S.Button
          style={styles.bigBottomBtn} circular
          onClick={() => this.stopRecording()}
          color='yellow' size='massive' icon='stop'></S.Button>}
        <Config open={configOpen} onSave={(cfg) => this.setState({ config: cfg, configOpen: false })} />
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
  connOffLabel: { zIndex: 99, position: 'absolute', backgroundColor: 'unset', color: 'red' },
  connProcLabel: { zIndex: 99, position: 'absolute', backgroundColor: 'unset', color: '#03dac6' },
  settingsLabel: {
    zIndex: 99, right: '0px',
    position: 'absolute', backgroundColor: 'unset',
    color: 'grey', fontSize: '2rem', margin: 0, padding: '20px 1px 10px 10px'
  }
};

export default App;
