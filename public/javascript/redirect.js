document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    // eslint-disable-next-line eqeqeq
    if (window.location.href.indexOf('response') != -1) {
      window.location = 'https://guest-guide-book.netlify.com/packages';
    }
  }, 5000);
});
