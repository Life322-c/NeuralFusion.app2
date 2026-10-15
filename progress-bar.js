/* Reading progress bar for long-form pages (CSP-safe external script). */
(function () {
  var bar = document.getElementById('progressBar');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  });
})();
