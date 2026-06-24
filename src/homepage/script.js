document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(API_BASE_URL + '/restaurants');
    const restaurants = await res.json();

    document.getElementById('stat-restaurants').textContent = restaurants.length;

    const cuisines = new Set(restaurants.map(r => r.cuisine_type).filter(Boolean));
    document.getElementById('stat-cuisines').textContent = cuisines.size;

    const totalReviews = restaurants.reduce((sum, r) => sum + Number(r.total_reviews || 0), 0);
    document.getElementById('stat-reviews').textContent = totalReviews;

    const grid = document.getElementById('restaurant-grid');
    const featured = restaurants.slice(0, 6);

    featured.forEach(r => {
      const avg = Number(r.average_rating || 0).toFixed(1);
      const card = document.createElement('div');
      card.className = 'restaurant-card';
      card.innerHTML = `
        <div class="card-image">
          <img src="${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}" alt="${r.name}" />
        </div>
        <div class="card-body">
          <h3>${r.name}</h3>
          <div class="card-meta">
            <span class="badge"><i class="fas fa-utensils"></i> ${r.cuisine_type || 'Restaurant'}</span>
            <span class="badge"><i class="fas fa-map-marker-alt"></i> ${r.location || ''}</span>
            ${r.price_range ? `<span class="badge">${r.price_range}</span>` : ''}
          </div>
          <p class="card-desc">${r.description || ''}</p>
          <div class="card-footer">
            <span class="rating"><i class="fas fa-star"></i> ${avg} <span style="color:#6B7280;font-weight:normal">(${r.total_reviews || 0})</span></span>
            <a href="../login/signup.html" class="card-link">Reserve &rarr;</a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Failed to load restaurants:', e);
  }
});
