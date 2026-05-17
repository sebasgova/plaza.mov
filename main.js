document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#soundToggle');
  if (!button) return;
  button.addEventListener('click', () => {
    button.classList.toggle('is-active');
  });
});
