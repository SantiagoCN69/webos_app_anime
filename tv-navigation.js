let currentIndex = 0; // Índice de la tarjeta de anime actual
const columns = 6; // Número de columnas

function actualizarFoco(animeCards) {
  animeCards.forEach((card, i) => {
    if (i === currentIndex) {
      card.classList.add("focused");
      card.focus(); // Si usas tabindex
    } else {
      card.classList.remove("focused");
    }
  });
}

document.addEventListener("keydown", (e) => {
    const animeCards = document.querySelectorAll(".anime-card");
    const busquedaInput = document.getElementById("busqueda");
  
    // Si el foco está en el input de búsqueda o currentIndex es -1
    if (document.activeElement === busquedaInput || currentIndex === -1) {
      switch (e.key) {
        case "ArrowDown":
          // Si presionas "ArrowDown" en el input de búsqueda, mover foco a la primera tarjeta de la primera fila
          if (animeCards.length > 0) {
            animeCards[0].focus();
            currentIndex = 0; // Establecer el índice en la primera tarjeta
          }
          break;
  
        case "Enter":
          // Si presionas "Enter" en el input de búsqueda, realizar la búsqueda
          buscarAnime();
          break;

        case "ArrowUp":
          // Si estás en el input y presionas ArrowUp, mantente en el input
          busquedaInput.focus();
          break;
      }
      return; // Si el foco está en el input, no hacer más acciones
    }
  
    // Si el foco está en las tarjetas de anime
    if (animeCards.length === 0) return;
  
    switch (e.key) {
      case "ArrowRight":
        if (currentIndex % columns !== columns - 1) { // Si no está en la última columna, mover a la derecha
          currentIndex++;
        }
        break;
  
      case "ArrowLeft":
        if (currentIndex % columns !== 0) { // Si no está en la primera columna, mover a la izquierda
          currentIndex--;
        }
        break;
  
      case "ArrowDown":
        if (currentIndex + columns < animeCards.length) { // Mover hacia abajo
          currentIndex += columns;
        }
        break;
  
      case "ArrowUp":
        if (currentIndex - columns >= 0) { // Mover hacia arriba
          currentIndex -= columns;
        } else if (currentIndex < columns) { // Si está en la primera fila
          busquedaInput.focus();
          currentIndex = -1; // Resetear índice para indicar que estamos en el input
        }
        break;
  
      case "Enter":
        // Si presionas "Enter" cuando una tarjeta está enfocada, hacer algo con la tarjeta
        const btn = animeCards[currentIndex].querySelector("button");
        if (btn) btn.click();
        break;
  
      case "Tab":
        // Si presionas "Tab", mover foco al input de búsqueda
        busquedaInput.focus();
        break;
    }
  
    // Actualizar el enfoque en las tarjetas
    actualizarFoco(animeCards);
  });
  

function buscarAnime() {
  const query = document.getElementById("busqueda").value;
  if (!query) return;
  fetch(`https://backend-animeflv-lite.onrender.com/api/search?q=${query}`)
    .then((res) => res.json())
    .then((res) => mostrarResultados(res.data));
}

function mostrarResultados(data) {
  const contenedor = document.getElementById("main");
  contenedor.innerHTML = "";

  const resultados = data.data || data;

  resultados.forEach((anime) => {
    let animeId = "";
    if (anime.url) {
      const urlParts = anime.url.split("/");
      const fullId = urlParts[urlParts.length - 1];
      animeId = fullId.replace(/-\d+$/, "");
    } else if (anime.id) {
      animeId = anime.id.replace(/-\d+$/, "");
    } else {
      animeId = extraerIdDeLink(anime.link || "");
    }

    const btnHtml = animeId
      ? `<button onclick="ver('${animeId}')">Ver</button>`
      : `<button disabled>No disponible</button>`;

    const div = document.createElement("div");
    div.className = "anime-card content-item";
    div.innerHTML = `
      <img src="${anime.cover || anime.image || anime.poster || ""}" alt="${anime.title || anime.name}">
      <strong>${anime.title || anime.name}</strong>
      ${btnHtml}`;
    contenedor.appendChild(div);
  });
}

function extraerIdDeLink(link) {
  if (!link) return "";
  const partes = link.split("/");
  return partes[partes.length - 1] || "";
}

function ver(id) {
  location.href = `anime.html?id=${id}`;
}
