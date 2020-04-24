document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    // eslint-disable-next-line eqeqeq
    if (window.location.href.indexOf('response') != -1) {
      window.location = 'http://localhost:3001/packages';
    }
  }, 5000);
});
