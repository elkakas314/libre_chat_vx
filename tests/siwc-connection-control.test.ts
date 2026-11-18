import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SiwcConnectionControl} from '../src/ui/SiwcConnectionControl';

test('SIWC connection control presents official plan consent without exposing credentials',()=>{
  const html=renderToStaticMarkup(React.createElement(SiwcConnectionControl));
  assert.match(html,/Continuar con ChatGPT/);
  assert.match(html,/cuota compartida y limitada/);
  assert.match(html,/devolución OAuth es local a ese equipo/);
  assert.match(html,/Actualizar estado/);
  assert.doesNotMatch(html,/access.?token|refresh.?token|api.?key/i);
});
