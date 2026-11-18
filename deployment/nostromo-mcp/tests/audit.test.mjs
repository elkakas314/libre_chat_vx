import test from 'node:test';
import assert from 'node:assert/strict';
import {userSystemdEnv} from '../audit.mjs';

test('user systemd environment targets the requested runtime uid',()=>{
  assert.deepEqual(userSystemdEnv(1000),{
    XDG_RUNTIME_DIR:'/run/user/1000',
    DBUS_SESSION_BUS_ADDRESS:'unix:path=/run/user/1000/bus'
  });
});

test('user systemd environment fails closed for an invalid uid',()=>{
  assert.equal(userSystemdEnv(-1),null);
  assert.equal(userSystemdEnv(Number.NaN),null);
});
