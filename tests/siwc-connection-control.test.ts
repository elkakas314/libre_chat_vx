import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {nostromoHubSourceSnapshot} from '../src/hud/nostromoHub';
import {TentaculoHub} from '../src/ui/TentaculoHub';
import {SiwcConnectionControl} from '../src/ui/SiwcConnectionControl';

test('SIWC connection control presents official plan consent without exposing credentials',()=>{
  const html=renderToStaticMarkup(React.createElement(SiwcConnectionControl));
  assert.match(html,/Continuar con ChatGPT/);
  assert.match(html,/cuota compartida y limitada/);
  assert.match(html,/devolución OAuth es local a ese equipo/);
  assert.match(html,/Actualizar estado/);
  assert.doesNotMatch(html,/access.?token|refresh.?token|api.?key/i);
});

test('the native Tentaculo Hub includes the official consent control without claiming LIVE state',()=>{
  const html=renderToStaticMarkup(React.createElement(TentaculoHub,{
    snapshot:nostromoHubSourceSnapshot(),
  }));
  assert.match(html,/data-testid="nostromo-tentaculo-hub"/);
  assert.match(html,/Continuar con ChatGPT/);
  assert.match(html,/ChatGPT sin sesión OAuth verificada/);
});
