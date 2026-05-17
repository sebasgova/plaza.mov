document.addEventListener('DOMContentLoaded', () => {
  const link = document.createElement('a');
  link.href = '#main-content';
  link.className = 'skip-to-content';
  link.textContent = 'Saltar al contenido';
  document.body.prepend(link);
});
