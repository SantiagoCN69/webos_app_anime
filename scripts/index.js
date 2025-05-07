import { db, auth } from './firebase-login.js';
import {
  collection,
  doc,
  getDocs,
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const contadores = document.querySelectorAll('span.contador');
  contadores.forEach(contadorSpan => {
    let tiempoRestante = 23;
    contadorSpan.textContent = tiempoRestante + 's';
    const intervalo = setInterval(() => {
      tiempoRestante--;
      if (tiempoRestante >= 0) {
        contadorSpan.textContent = tiempoRestante + 's';
      } else {
        clearInterval(intervalo);
        contadorSpan.textContent = '';
      }
    }, 1000);
  });
});

function extraerIdDeLink(link) {
  if (!link) return '';
  const partes = link.split('/');
  let id = partes[partes.length - 1] || '';
  return id.replace(/(-\d+)$/, '');
}

function ver(id) {
  window.location.href = `anime.html?id=${id}`;
}

function mostrarSeccionDesdeHash() {
  const hash = window.location.hash;
  if (!hash) return;

  const id = decodeURIComponent(hash.substring(1));
  const seccion = document.getElementById(id);
  if (!seccion) return;

  document.querySelectorAll(".content-section").forEach(sec => 
    sec.classList.toggle("hidden", sec.id !== id)
  );

  document.querySelectorAll('.sidebar li').forEach(item => 
    item.classList.toggle('active-menu-item', item.getAttribute('data-target') === id)
  );
  actualizarAlturaMain();
}

window.addEventListener("DOMContentLoaded", () => {
  mostrarSeccionDesdeHash();
});
window.addEventListener("hashchange", () => {
  mostrarSeccionDesdeHash();
});

window.handleHashChange = function () {
  let hash = window.location.hash.substring(1);

  if (!hash) {
    hash = 'Ultimos-Episodios';
    history.replaceState(null, '', '#' + hash);
  }

  document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));

  const targetSection = document.getElementById(hash);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    actualizarAlturaMain();

    const activeMenuItem = document.querySelector(`.sidebar li[data-target="${hash}"]`);
    if (activeMenuItem) {
      document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
      activeMenuItem.classList.add('active');
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    cargarFavoritos(),
    cargarViendo(),
    cargarPendientes(),
    cargarCompletados(),
    cargarUltimosCapsVistos(),
    cargarUltimosCapitulos()
  ])
  
  window.addEventListener('resize', actualizarAlturaMain);

  const sidebarItems = document.querySelectorAll('.sidebar li');
  sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
      const targetId = e.target.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.remove('hidden');
        
        history.pushState(null, '', `#${targetId}`);
      }
      
      actualizarAlturaMain();
    });
  });


});

function actualizarAlturaMain() {
  const contentSection = document.querySelector('.content-section:not(.hidden)') || 
                         document.querySelector('.content-section');

  if (!contentSection) return;

  requestAnimationFrame(() => {
    const alturaFinal = contentSection.offsetHeight;
    
    document.documentElement.style.setProperty('--altura-main', `${alturaFinal}px`);
  });
}

function crearElementoSiguienteCapitulo(itemData) {
  const btn = document.createElement('div');
  btn.className = 'btn-siguiente-capitulo';
  
  const portada = document.createElement('img');
  portada.src = itemData.portada;
  portada.alt = itemData.titulo;
  portada.className = 'portada-anime';
  portada.onerror = () => {
    portada.src = 'path/to/default/image.png'; 
  };
  
  const contenedorTexto = document.createElement('div');
  contenedorTexto.className = 'contenedor-texto-capitulo';

  const spanTitulo = document.createElement('span'); 
  spanTitulo.classList.add('texto-2-lineas');
  spanTitulo.textContent = itemData.titulo;

  const spanEpisodio = document.createElement('span');
  spanEpisodio.className = 'texto-episodio';
  spanEpisodio.textContent = `Ep. ${itemData.siguienteCapitulo}`;

  contenedorTexto.appendChild(spanTitulo);
  contenedorTexto.appendChild(spanEpisodio);
  
  btn.appendChild(portada);
  btn.appendChild(contenedorTexto);
  
  btn.addEventListener('click', () => {
    window.location.href = `ver.html?animeId=${itemData.animeId}&url=${encodeURIComponent(itemData.siguienteEpisodioUrl)}`;
  });

  return btn;
}

async function cargarUltimosCapsVistos() {
  const ultimosCapsContainer = document.getElementById('ultimos-caps-viendo');
  if (!ultimosCapsContainer) return;

  const renderizarBotones = (datos) => {
    ultimosCapsContainer.innerHTML = ''; 
    if (!datos || datos.length === 0) {
      ultimosCapsContainer.innerHTML = '<p>No tienes capítulos siguientes disponibles.</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    datos.forEach(itemData => {
      const btn = crearElementoSiguienteCapitulo(itemData);
      if (btn) {
        fragment.appendChild(btn);
      }
    });
    ultimosCapsContainer.appendChild(fragment);
    actualizarAlturaMain(); 
  };

  const user = await new Promise(resolve => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });

  if (!user) {
    ultimosCapsContainer.innerHTML = '<p>Inicia sesión para ver tus últimos capítulos</p>';
    return;
  }

  const cacheKey = `ultimosCapsVistosCache_${user.uid}`;
  let cachedData = null;

  try {
    const cachedDataString = localStorage.getItem(cacheKey);
    if (cachedDataString) {
      cachedData = JSON.parse(cachedDataString);
      if (Array.isArray(cachedData)) {
        renderizarBotones(cachedData);
      } else {
        cachedData = null;
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.error("Error al leer o parsear caché:", error);
    cachedData = null;
    localStorage.removeItem(cacheKey);
  }

  try {
    const ref = collection(doc(db, "usuarios", user.uid), "caps-vistos");
    const snap = await getDocs(ref);
    let freshData = [];

    if (!snap.empty) {
      const capVistos = snap.docs
        .map(docSnap => ({
          animeId: docSnap.id,
          ...docSnap.data()
        }))
        .sort((a, b) => {
          const fechaA = new Date(a.fechaAgregado?.toDate?.() || a.fechaAgregado || 0);
          const fechaB = new Date(b.fechaAgregado?.toDate?.() || b.fechaAgregado || 0);
          return fechaB - fechaA; 
        })
        .slice(0, 10); 

      const animeRefs = capVistos.map(cap => doc(db, "datos-animes", cap.animeId));
      const animeDocsSnap = await Promise.all(animeRefs.map(ref => getDoc(ref)));

      const animeDataMap = {};
      animeDocsSnap.forEach((docSnap, i) => {
        if (docSnap.exists()) {
          animeDataMap[capVistos[i].animeId] = docSnap.data();
        }
      });

      freshData = capVistos.map(cap => {
        const animeDetails = animeDataMap[cap.animeId];

        if (!animeDetails || !animeDetails.portada || !animeDetails.episodios || !animeDetails.titulo) {
          return null;
        }

        const ultimoCapVisto = Math.max(...(cap.episodiosVistos || []).map(Number), 0);
        const siguienteCapitulo = ultimoCapVisto + 1;
        
        const episodiosDelAnime = typeof animeDetails.episodios === 'object' && animeDetails.episodios !== null ? animeDetails.episodios : {};
        const siguienteEpisodio = Object.values(episodiosDelAnime)
          .find(ep => ep.number === siguienteCapitulo);

        if (siguienteEpisodio?.url) {
          return {
            animeId: cap.animeId,
            portada: animeDetails.portada,
            titulo: animeDetails.titulo,
            siguienteCapitulo,
            siguienteEpisodioUrl: siguienteEpisodio.url
          };
        }
        return null;
      }).filter(Boolean);
    }
    const freshDataString = JSON.stringify(freshData);
    const cachedDataString = JSON.stringify(cachedData);

    if (freshDataString !== cachedDataString) {
      renderizarBotones(freshData);
      localStorage.setItem(cacheKey, freshDataString);
    } else {
      if (cachedData === null && freshData.length === 0) {
      } else if (cachedData === null && freshData.length > 0) {
        renderizarBotones(freshData);
        localStorage.setItem(cacheKey, freshDataString);
      } else {
      }
    }

  } catch (error) {
    console.error('Error general al cargar últimos capítulos vistos desde Firestore:', error);
    if (cachedData === null) {
      ultimosCapsContainer.innerHTML = '<p>Error al cargar últimos capítulos</p>';
      actualizarAlturaMain();
    }
  }
}

  // Función para crear tarjeta de anime
  function createAnimeCard(anime) {
    const cover = anime.cover || anime.image || anime.poster || anime.portada || 'img/background.webp';
    const title = anime.title || anime.name || anime.nombre || anime.titulo || 'Título no disponible';
    const link = anime.link || anime.url || '';
    const animeId = anime.id || anime.anime_id || '';
    const chapter = anime.chapter || '';
    const estado = anime.estado || '';
    const rating = anime.rating || '';
  
    const div = document.createElement('div');
    div.className = 'anime-card';
    div.style.setProperty('--cover', `url(${cover})`);
    let chapterHtml = ''; 
    if (chapter) {
      chapterHtml = `<span>Episodio ${chapter}</span>`;
    }
    let estadoHtml = '';
    if (estado) {
      if (estado === 'En emision') {
        estadoHtml = `<span><img src="../icons/circle-solid-blue.svg" alt="${estado}">${estado}</span>`;
      }
      else{
        estadoHtml = `<span><img src="../icons/circle-solid.svg" alt="${estado}">${estado}</span>`;
      }
    }
    let ratingHtml = '';
    if (rating) {
      ratingHtml = `<span class="rating"><img src="../icons/star-solid.svg" alt="${rating}">${rating}</span>`;
    }
    div.innerHTML = `
      <div class="container-img">
        <img src="${cover}" alt="${title}">
        ${chapterHtml}
        ${estadoHtml}
        ${ratingHtml}
      </div>
      <strong>${title}</strong>
    `;
    
    div.addEventListener('click', () => {
      if (animeId) {
        ver(animeId);
      } else {
        const extractedId = extraerIdDeLink(link);
        
        if (extractedId) {
          ver(extractedId);
        } else {
          console.error('No se pudo extraer ID para:', title, 'Link:', link);
          alert(`No se pudo encontrar el ID para: ${title}`);
        }
      }
    });
  
    return div;
  }

  function leerCache(key) {
    try {
      const raw = localStorage.getItem(key);
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error leyendo cache (${key}):`, e);
      localStorage.removeItem(key);
    }
    return null;
  }
  
  function guardarCache(key, data) {
    if (!Array.isArray(data) || data.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }
  async function cargarUltimosCapitulos() {
    const mainContainer = document.getElementById('ultimos-episodios');
    if (!mainContainer) return;
  
    const renderizarUltimosEpisodios = (datos) => {
      document.querySelectorAll('.init-loading-servidores').forEach(el => el.style.display = 'none');
      mainContainer.innerHTML = '';
      if (!datos || datos.length === 0) {
        mainContainer.innerHTML = '<p>No se encontraron últimos episodios.</p>';
        actualizarAlturaMain();
        return;
      }
      const fragment = document.createDocumentFragment();
      datos.forEach(anime => {
        const card = createAnimeCard(anime || {});
        if (card) fragment.appendChild(card);
      });
      mainContainer.appendChild(fragment);
      actualizarAlturaMain();
    };
  
    const cacheKey = 'ultimosEpisodiosGeneralesCache';
    const cachedData = leerCache(cacheKey);
    if (cachedData) {
      console.log("Mostrando últimos episodios desde caché...");
      renderizarUltimosEpisodios(cachedData);
    }
  
    try {
      const res = await fetch('https://backend-animeflv-lite.onrender.com/api/latest');
      if (!res.ok) throw new Error(`Error de red: ${res.status}`);
      const data = await res.json();
  
      const extraerListaValida = (obj) => {
        const posibles = ['latestEpisodes', 'animesEnEmision', 'ultimosAnimes', 'data', 'results', 'animes'];
        for (const key of posibles) {
          if (Array.isArray(obj[key])) return obj[key];
        }
        for (const key in obj) {
          if (Array.isArray(obj[key])) return obj[key];
        }
        return Array.isArray(obj) ? obj : [];
      };
  
      const rawList = extraerListaValida(data);
      const freshData = rawList.map(item => ({
        id: item.id || item.anime_id || (item.url ? item.url.split('/').pop().replace(/-\d+$/, '') : 'id_' + Math.random().toString(16).slice(2)),
        title: item.title || item.name || item.nombre || 'Anime sin título',
        cover: item.cover || item.image || item.poster || '',
        link: item.url || '',
        chapter: item.chapter || '',
      })).filter(item => item.title !== 'Anime sin título');
  
      const cachedString = JSON.stringify(cachedData);
      const freshString = JSON.stringify(freshData);
  
      if (freshString !== cachedString) {
        console.log("Datos de API diferentes a la caché. Actualizando UI y caché...");
        renderizarUltimosEpisodios(freshData);
        guardarCache(cacheKey, freshData);
      } else if (!cachedData) {
        console.log("Mostrando datos frescos de API (sin caché previa).");
        renderizarUltimosEpisodios(freshData);
        guardarCache(cacheKey, freshData);
      } else {
        console.log("Datos de API coinciden con la caché. No se requiere actualización.");
      }
  
    } catch (error) {
      console.error('Error al cargar últimos capítulos desde API:', error);
      if (!cachedData) {
        mainContainer.innerHTML = '<p>Error al cargar últimos episodios.</p>';
        actualizarAlturaMain();
      }
    }
  }
  async function cargarFavoritos() {
    const favsContainer = document.getElementById('favs');
    if (!favsContainer) return;
  
    const renderizarFavoritos = (datos, reemplazar = false) => {
      if (reemplazar) favsContainer.innerHTML = '';
      const fragment = document.createDocumentFragment();
      datos.forEach(anime => {
        const card = createAnimeCard(anime || {});
        if (card) fragment.appendChild(card);
      });
      favsContainer.appendChild(fragment);
      actualizarAlturaMain();
    };
  
    const dividirEnBloques = (array, tamaño) => {
      const bloques = [];
      for (let i = 0; i < array.length; i += tamaño) {
        bloques.push(array.slice(i, i + tamaño));
      }
      return bloques;
    };
  
    const user = await new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  
    if (!user) {
      favsContainer.innerHTML = '<p>Inicia sesión para ver tus favoritos</p>';
      actualizarAlturaMain();
      return;
    }
  
    const userId = user.uid;
    const cacheKey = `favoritosCache_${userId}`;
    const cachedData = leerCache(cacheKey);
  
    if (cachedData) {
      console.log("Mostrando favoritos desde caché...");
      renderizarFavoritos(cachedData, true);
    }
  
    try {
      const ref = collection(doc(db, "usuarios", userId), "favoritos");
      const snap = await getDocs(ref);
  
      if (snap.empty) {
        renderizarFavoritos([], true);
        localStorage.removeItem(cacheKey);
        return;
      }
  
      const ids = snap.docs.map(doc => doc.id);
      const bloques = dividirEnBloques(ids, 10);
      const freshData = [];
  
      const primerBloque = await Promise.all(
        bloques[0].map(id =>
          getDoc(doc(db, "datos-animes", id))
            .then(docSnap => docSnap.exists() ? {
              id,
              titulo: docSnap.data().titulo || 'Título no encontrado',
              portada: docSnap.data().portada || 'img/background.webp',
              estado: docSnap.data().estado || 'No disponible',
              rating: docSnap.data().rating || null
            } : null)
            .catch(error => {
              console.error(`Error al obtener anime ${id}:`, error);
              return null;
            })
        )
      );
  
      freshData.push(...primerBloque.filter(Boolean));
      renderizarFavoritos(freshData, true);
  
      for (let i = 1; i < bloques.length; i++) {
        const bloque = bloques[i];
        const resultados = await Promise.all(
          bloque.map(id =>
            getDoc(doc(db, "datos-animes", id))
              .then(docSnap => docSnap.exists() ? {
                id,
                titulo: docSnap.data().titulo || 'Título no encontrado',
                portada: docSnap.data().portada || 'img/background.webp',
                estado: docSnap.data().estado || 'No disponible'
              } : null)
              .catch(error => {
                console.error(`Error al obtener anime ${id}:`, error);
                return null;
              })
          )
        );
        const nuevos = resultados.filter(Boolean);
        freshData.push(...nuevos);
        renderizarFavoritos(nuevos);
      }
  
      guardarCache(cacheKey, freshData);
    } catch (error) {
      console.error('Error al cargar favoritos desde Firestore:', error);
      if (!cachedData) {
        favsContainer.innerHTML = '<p>Error al cargar favoritos.</p>';
        actualizarAlturaMain();
      }
    }
  }

async function cargarViendo() {
  const viendoContainer = document.getElementById('viendo');
  if (!viendoContainer) return;

  const renderizarViendo = (datos, reemplazar = false) => {
    if (reemplazar) viendoContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    datos.forEach(anime => {
      const card = createAnimeCard(anime || {});
      if (card) fragment.appendChild(card);
    });
    viendoContainer.appendChild(fragment);
    actualizarAlturaMain();
  };

  const dividirEnBloques = (array, tamaño) => {
    const bloques = [];
    for (let i = 0; i < array.length; i += tamaño) {
      bloques.push(array.slice(i, i + tamaño));
    }
    return bloques;
  };

  // Esperar a que el usuario esté autenticado
  const user = await new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!user) {
    viendoContainer.innerHTML = '<p>Inicia sesión para ver tus animes en curso</p>';
    actualizarAlturaMain();
    return;
  }

  const userId = user.uid;
  const cacheKey = `viendoCache_${userId}`;
  const cachedData = leerCache(cacheKey);

  if (cachedData) {
    console.log("Mostrando 'Viendo' desde caché...");
    renderizarViendo(cachedData, true);
  }

  try {
    const ref = collection(doc(db, "usuarios", userId), "viendo");
    const snap = await getDocs(ref);

    if (snap.empty) {
      renderizarViendo([], true);
      localStorage.removeItem(cacheKey);
      return;
    }

    const ids = snap.docs.map(doc => doc.id);
    const bloques = dividirEnBloques(ids, 10);
    const freshData = [];

    // Cargar y mostrar el primer bloque inmediatamente
    const primerBloque = await Promise.all(
      bloques[0].map(id =>
        getDoc(doc(db, "datos-animes", id))
          .then(docSnap => docSnap.exists() ? {
            id,
            titulo: docSnap.data().titulo || 'Título no encontrado',
            portada: docSnap.data().portada || 'img/background.webp',
            estado: docSnap.data().estado || 'No disponible',
            rating: docSnap.data().rating || null
          } : null)
          .catch(error => {
            console.error(`Error al obtener anime ${id}:`, error);
            return null;
          })
      )
    );

    freshData.push(...primerBloque.filter(Boolean));
    renderizarViendo(freshData, true);

    // Cargar bloques restantes en segundo plano
    for (let i = 1; i < bloques.length; i++) {
      const bloque = bloques[i];
      const resultados = await Promise.all(
        bloque.map(id =>
          getDoc(doc(db, "datos-animes", id))
            .then(docSnap => docSnap.exists() ? {
              id,
              titulo: docSnap.data().titulo || 'Título no encontrado',
              portada: docSnap.data().portada || 'img/background.webp',
              estado: docSnap.data().estado || 'No disponible',
              rating: docSnap.data().rating || null
            } : null)
            .catch(error => {
              console.error(`Error al obtener anime ${id}:`, error);
              return null;
            })
        )
      );
      const nuevos = resultados.filter(Boolean);
      freshData.push(...nuevos);
      renderizarViendo(nuevos);
    }

    // Guardar en caché todos los datos frescos
    guardarCache(cacheKey, freshData);
  } catch (error) {
    console.error('Error al cargar animes en curso desde Firestore:', error);
    if (!cachedData) {
      viendoContainer.innerHTML = '<p>Error al cargar animes en curso.</p>';
      actualizarAlturaMain();
    }
  }
}

// Cargar animes pendientes
async function cargarPendientes() {
  const cont = document.getElementById('pendientes');
  if (!cont) return;

  const render = (animes, reset = false) => {
    if (reset) cont.innerHTML = '';
    if (!animes || !animes.length) {
      cont.innerHTML = '<p>No tienes animes pendientes.</p>';
      return actualizarAlturaMain();
    }
    const frag = document.createDocumentFragment();
    animes.forEach(a => {
      const card = createAnimeCard(a);
      if (card) frag.appendChild(card);
    });
    cont.appendChild(frag);
    actualizarAlturaMain();
  };

  const user = await new Promise(res => onAuthStateChanged(auth, u => res(u)));
  if (!user) return render([], true);

  const key = `pendientesCache_${user.uid}`;
  const cache = leerCache(key);
  if (cache) render(cache, true);

  try {
    const snap = await getDocs(collection(doc(db, 'usuarios', user.uid), 'pendiente'));
    if (snap.empty) {
      return render([], true) && localStorage.removeItem(key);
    }

    const ids = snap.docs.map(d => d.id);
    const bloques = [];
    for (let i = 0; i < ids.length; i += 10) bloques.push(ids.slice(i, i + 10));

    let all = [];
    for (let i = 0; i < bloques.length; i++) {
      const datos = await Promise.all(
        bloques[i].map(id =>
          getDoc(doc(db, 'datos-animes', id))
            .then(ds => ds.exists() ? { id, ...ds.data() } : null)
            .catch(() => null)
        )
      );
      const valid = datos.filter(Boolean);
      all = all.concat(valid);
      render(valid, i === 0);
    }

    guardarCache(key, all);
  } catch {
    if (!cache) {
      cont.innerHTML = '<p>Error al cargar animes pendientes.</p>';
      actualizarAlturaMain();
    }
  }
}

async function cargarCompletados() {
  const completadosContainer = document.getElementById('completados');
  if (!completadosContainer) return;

  const renderizarCompletados = (datos, reset = false) => {
    if (reset) completadosContainer.innerHTML = '';
    if (!datos || datos.length === 0) {
      completadosContainer.innerHTML = '<p>No tienes animes completados.</p>';
      actualizarAlturaMain();
      return;
    }
    const fragment = document.createDocumentFragment();
    datos.forEach(anime => {
      const card = createAnimeCard(anime || {});
      if (card) fragment.appendChild(card);
    });
    completadosContainer.appendChild(fragment);
    actualizarAlturaMain();
  };

  const user = await new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (!user) {
    completadosContainer.innerHTML = '<p>Inicia sesión para ver tus animes completados</p>';
    actualizarAlturaMain();
    return;
  }

  const userId = user.uid;
  const cacheKey = `completadosCache_${userId}`;
  const cache = leerCache(cacheKey);

  if (cache) {
    renderizarCompletados(cache, true);
  }

  try {
    const ref = collection(doc(db, "usuarios", userId), "visto");
    const snap = await getDocs(ref);
    
    let freshData = [];
    if (!snap.empty) {
      const promises = snap.docs.map(docSnap => {
        const animeId = docSnap.id;
        return getDoc(doc(db, "datos-animes", animeId))
          .then(animeDetalleSnap => {
            if (animeDetalleSnap.exists()) {
              const animeData = animeDetalleSnap.data();
              return {
                id: animeId,
                titulo: animeData.titulo || 'Título no encontrado',
                portada: animeData.portada || 'img/background.webp',
                estado: animeData.estado || 'No disponible',
                rating: animeData.rating || null,
              };
            }
            return null;
          })
          .catch(() => null);
      });
      
      freshData = (await Promise.all(promises)).filter(item => item !== null);
    }

    if (JSON.stringify(freshData) !== JSON.stringify(cache)) {
      renderizarCompletados(freshData, true);
      guardarCache(cacheKey, freshData);
    } else if (cache === null && freshData.length > 0) {
      renderizarCompletados(freshData, true);
      guardarCache(cacheKey, freshData);
    } else if (cache === null && freshData.length === 0) {
      renderizarCompletados([]);
    }
  } catch (error) {
    if (!cache) {
      completadosContainer.innerHTML = '<p>Error al cargar animes completados.</p>';
      actualizarAlturaMain();
    }
  }
}


// Sidebar toggle y navegación
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const sections = document.querySelectorAll(".content-section");
  const menuItems = [...document.querySelectorAll(".sidebar li")];

  const toggleSidebar = () => sidebar.classList.toggle("active");
  const closeSidebar = () => sidebar.classList.remove("active");
  const isMobile = () => window.innerWidth <= 600;

  menuBtn.addEventListener("click", () => {
    if (!sidebar.classList.contains("active") && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toggleSidebar();
    }
  });

  window.addEventListener("scroll", () => {
    if (isMobile() && sidebar.classList.contains("active")) {
      closeSidebar();
    }
  });

  let touchStartX = 0;
  let touchEndX = 0;
  const handleSwipe = () => {
    if (sidebar.classList.contains("active")) {
      const dist = touchStartX - touchEndX;
      if (dist > 50) closeSidebar();
    }
  };
  document.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  document.addEventListener("touchend", e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

  sections.forEach(section => {
    let sx = 0, sy = 0, ex = 0, ey = 0;
  
    section.addEventListener("touchstart", e => {
      sx = e.changedTouches[0].screenX;
      sy = e.changedTouches[0].screenY;
    }, { passive: true });
  
    section.addEventListener("touchend", e => {
      ex = e.changedTouches[0].screenX;
      ey = e.changedTouches[0].screenY;
  
      const dx = ex - sx;
      const dy = Math.abs(ey - sy);
  
      if (dx > 50 && dy < 35 && !sidebar.classList.contains("active") && isMobile()) {
        if (window.scrollY > 0) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          const checkScroll = () => {
            if (window.scrollY === 0) {
              sidebar.classList.add("active");
            } else {
              requestAnimationFrame(checkScroll);
            }
          };
          checkScroll(); 
        } else {
          sidebar.classList.add("active");
        }
      }
    }, { passive: true });
  });

  sidebar.addEventListener("touchstart", function(e) {
    this._startY = e.touches[0].pageY;
    this._startScroll = this.scrollTop;
  }, { passive: false });

  sidebar.addEventListener("touchmove", function(e) {
    const y = e.touches[0].pageY;
    const dy = this._startY - y;
    const atTop = this.scrollTop === 0;
    const atBottom = this.scrollTop + this.clientHeight >= this.scrollHeight;
    if ((atTop && dy < 0) || (atBottom && dy > 0)) {
      e.preventDefault();
    }
  }, { passive: false });

  const firstItem = menuItems[0];
  firstItem.classList.add("active-menu-item");
  const firstSectionId = firstItem.getAttribute("data-target");
  sections.forEach(s => s.classList.add("hidden"));
  document.getElementById(firstSectionId).classList.remove("hidden");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-target");
      menuItems.forEach(i => i.classList.remove("active-menu-item"));
      item.classList.add("active-menu-item");
      sections.forEach(s => s.classList.add("hidden"));
      document.getElementById(id).classList.remove("hidden");
      if (isMobile()) closeSidebar();
    });
  });
});
