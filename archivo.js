const vendedores = [
  { nombre: 'Don Alirio', producto: 'Frutas', pregon: 'Lleve la fruta dulce para la casa' },
  { nombre: 'Doña Esperanza', producto: 'Arepas', pregon: 'Arepitas calientes para el desayuno' }
];

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('vendorGrid');
  grid.innerHTML = vendedores.map(v => `
    <article class="vendor-card">
      <h2>${v.nombre}</h2>
      <p>${v.producto}</p>
      <blockquote>${v.pregon}</blockquote>
    </article>
  `).join('');
});
