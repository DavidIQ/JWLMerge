(function(){
  function now(){ return new Date().toLocaleTimeString(); }
  function getDebugEl(){ return document.getElementById('debugLog'); }
  function append(msg){
    try {
      const el = getDebugEl();
      const line = `${now()} ${msg}`;
      if (el) {
        el.textContent = line + '\n' + el.textContent;
      }
    } catch(e){}
    try { console.log('[AppLogger]', msg); } catch(e){}
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init){
    const method = (init && init.method) || (typeof input === 'string' ? 'GET' : (input.method || 'GET'));
    const url = (typeof input === 'string') ? input : (input && input.url) || String(input);
    const id = Math.random().toString(36).slice(2,9);
    append(`FETCH[${id}] -> ${method} ${url}`);
    const t0 = performance.now();
    try {
      const res = await originalFetch(input, init);
      const t1 = performance.now();
      append(`FETCH[${id}] <- ${res.status} ${res.statusText} (${Math.round(t1-t0)}ms)`);
      return res;
    } catch (err) {
      const t1 = performance.now();
      append(`FETCH[${id}] !! error ${String(err)} (${Math.round(t1-t0)}ms)`);
      throw err;
    }
  };

  window.AppLogger = {
    log: append,
    info: append,
    warn: msg => append('WARN: ' + msg),
    error: msg => append('ERROR: ' + msg)
  };

  window.addEventListener('error', e => {
    append('Window error: ' + e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || ''));
  });
  window.addEventListener('unhandledrejection', e => {
    try{
      const reason = e.reason && e.reason.toString ? e.reason.toString() : JSON.stringify(e.reason);
      append('UnhandledRejection: ' + reason);
    } catch(ex){ append('UnhandledRejection (unserializable)'); }
  });
})();
