// Failsafe: if the app fails to load (blocked CDN, network error), never leave the splash/spinner stuck.
(function () {
  function hideSplash() { var s = document.getElementById('splash'); if (s) s.remove(); }
  window.addEventListener('load', function () { setTimeout(hideSplash, 5000); });
  setTimeout(function () {
    var sk = document.getElementById('nf-skeleton');
    if (sk) {
      hideSplash();
      sk.innerHTML = '<div style="max-width:420px;padding:24px;text-align:center;color:#FFFFFF;font-size:16px;line-height:1.6">NeuralFusion could not load. Check your connection and <a href="/" style="color:#E8B931">reload the page</a>.</div>';
    }
  }, 15000);
})();
