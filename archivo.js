const vendedores = [
  { nombre: 'Don Alirio', producto: 'Frutas', pregon: 'Lleve la fruta dulce para la casa', audio: 'audio/don_alirio.mp3' },
  { nombre: 'Doña Esperanza', producto: 'Arepas', pregon: 'Arepitas calientes para el desayuno', audio: 'audio/dona_esperanza.mp3' }
];

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('vendorGrid');
  grid.innerHTML = vendedores.map(v => `
    <article class="vendor-card">
      <h2>${v.nombre}</h2>
      <p>${v.producto}</p>
      <blockquote>${v.pregon}</blockquote>
      ${v.audio ? `<audio controls src="${v.audio}"></audio>` : ``}
    </article>
  `).join('');
});
