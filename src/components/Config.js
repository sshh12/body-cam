import React, { useState } from 'react';
import * as S from 'semantic-ui-react'

const CFG_KEY = 'CFG-v4';

export let cfg;
if (!localStorage.getItem(CFG_KEY)) {
  cfg = {
    setup: false,
    name: '',
    email: '',
    uploadWhile: true,
    sendEmail: true,
    download: true,
    longPress: false,
    autoStopMins: 15
  };
} else {
  cfg = JSON.parse(localStorage.getItem(CFG_KEY))
}

function Config({ open, onSave }) {
  let set = {};
  let get = {};
  let [cfgState, setCfgState] = useState({...cfg});
  for(let key in cfg) {
    get[key] = cfgState[key];
    set[key] = (val) => setCfgState({...cfgState, [key]: val});
  }
  return <S.Modal open={open}>
    <S.Modal.Content>
      <S.Modal.Description>
        {!get.setup && <div>
          <p><b>What is this?</b> Body cam is a video recorder than backs up your video as it is being recorded. In the event you lose your phone or it's destroyed while recording, the video captured so far will be sent to your email.</p>
          <p><b>Who can access my video?</b> Your video is stored privately in the cloud while the recording takes place. It is deleted as soon as the email is sent.</p>
          <p><b>Are there bugs?</b> Yes, this is still a proof-of-concept. For critical use cases, using your device's camera app may be a better idea.</p>
          <hr/>
        </div>}
        <S.Form>
          <S.Form.Field>
            <label>Name</label>
            <input value={get.name} onChange={(evt) => set.name(evt.target.value)} placeholder='' />
          </S.Form.Field>
          <S.Form.Field>
            <label>Email</label>
            <input value={get.email} onChange={(evt) => set.email(evt.target.value)} placeholder='' />
          </S.Form.Field>
          <hr />
          <S.Form.Checkbox checked={get.uploadWhile} onChange={() => set.uploadWhile(!get.uploadWhile)} label='Upload while recording' />
          <S.Form.Checkbox checked={get.sendEmail} onChange={() => set.sendEmail(!get.sendEmail)} label='Send recording as email' />
          <S.Form.Checkbox checked={get.download} onChange={() => set.download(!get.download)} label='Download to device' />
          <S.Form.Checkbox disabled checked={get.longPress} onChange={() => set.longPress(!get.longPress)} label='Long press to stop recording' />
          <S.Form.Field
            control={S.Input}
            type='number'
            max={60 * 24}
            value={get.autoStopMins}
            onChange={(evt) => set.autoStopMins(evt.target.value)}
            label='Automatically stop recording and send after X minutes'
          />
          <S.Button color='blue' onClick={() => {
            let newCfg = { ...get, setup: true };
            Object.assign(cfg, newCfg);
            localStorage.setItem(CFG_KEY, JSON.stringify(newCfg));
            onSave(newCfg);
          }} type='submit'>Save</S.Button>
        </S.Form>
      </S.Modal.Description>
    </S.Modal.Content>
  </S.Modal>
}

export default Config;