import React, { useState } from 'react';
import * as S from 'semantic-ui-react'

const CFG_KEY = 'CFG-v3';

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
    autoStopSecs: 3000
  };
} else {
  cfg = JSON.parse(localStorage.getItem(CFG_KEY))
}

function Config({ open, onSave }) {
  let set = {};
  let get = {};
  for (let key in cfg) {
    let [getter, setter] = useState(cfg[key]);
    get[key] = getter;
    set[key] = setter;
  }
  return <S.Modal open={open}>
    <S.Modal.Content>
      <S.Modal.Description>
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
            max={60 * 60}
            value={get.autoStopSecs}
            onChange={(evt) => set.autoStopSecs(evt.target.value)}
            label='Automatically stop recording and send after X seconds'
          />
          <S.Button color='blue' onClick={() => {
            let newCfg = { ...get, setup: true };
            localStorage.setItem(CFG_KEY, JSON.stringify(newCfg));
            onSave(newCfg);
          }} type='submit'>Save</S.Button>
        </S.Form>
      </S.Modal.Description>
    </S.Modal.Content>
  </S.Modal>
}

export default Config;