import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { firebaseConfig } from "./firebaseconfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const btnLoginHeader = document.getElementById('btn-login'); // Botón original del header
const loginSection = document.getElementById('login-section');
const emailInput = document.getElementById('email-input');
const btnSendLink = document.getElementById('btn-send-link');
const loginMessage = document.getElementById('login-message');
const contentSections = document.querySelectorAll('.content-section'); // Todas las secciones principales de contenido
const defaultSectionId = 'Ultimos-Episodios'; // Sección a mostrar tras login exitoso

// --- Gestión de visibilidad de secciones ---
function mostrarSeccion(idSeccionAMostrar) {
  contentSections.forEach(section => {
    if (section.id === idSeccionAMostrar) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });

  // Si se muestra la sección de login o si se ocultan todas las secciones de contenido (idSeccionAMostrar es ''),
  // quitar la clase 'active-menu-item' de todos los <li> del sidebar.
  if (idSeccionAMostrar === 'login-section' || idSeccionAMostrar === '') {
    const sidebarLiItems = document.querySelectorAll('.sidebar ul li');
    sidebarLiItems.forEach(item => {
      item.classList.remove('active-menu-item');
    });
  }
}

// --- Lógica de UI y caché ---
function updateUIForUser(user) {
  if (!btnLoginHeader) return;

  if (user) {
    btnLoginHeader.setAttribute('data-username', user.displayName || user.email); 
    btnLoginHeader.style.setProperty('--user-photo', `url('${user.photoURL || '../icons/user-solid.svg'}')`);
    btnLoginHeader.classList.add('logged-in');
    
    try {
      localStorage.setItem('cachedUserDisplayName', user.displayName || user.email);
      localStorage.setItem('cachedUserPhotoURL', user.photoURL || '');
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
    mostrarSeccion(defaultSectionId); 
  } else {
    btnLoginHeader.style.setProperty('--user-photo', `url('../icons/user-solid.svg')`);
    btnLoginHeader.removeAttribute('data-username');
    btnLoginHeader.classList.remove('logged-in');

    try {
      localStorage.removeItem('cachedUserDisplayName');
      localStorage.removeItem('cachedUserPhotoURL');
    } catch (e) {
      console.warn('No se pudo limpiar localStorage:', e);
    }
    // Si estamos procesando un enlace de inicio de sesión, mostrar la login-section para mensajes.
    // De lo contrario (no hay usuario, no es un enlace), no hacer nada aquí con la visibilidad de las secciones.
    // Ultimos-Episodios será visible por defecto desde el HTML.
    // login-section (oculta por HTML) solo se mostrará al hacer clic en btnLoginHeader.
    if (isSignInWithEmailLink(auth, window.location.href)) {
        mostrarSeccion('login-section'); 
    }
  }
}

// --- Lógica de Autenticación por Enlace ---
const actionCodeSettings = {
  url: window.location.origin + window.location.pathname, // URL a la que se redirigirá. Puede ser la misma página.
  handleCodeInApp: true, // El enlace se manejará en la app.
  // Otras configuraciones como iOSBundleId, androidPackageName si es necesario.
};

async function enviarEnlace(email) {
  if (!emailInput || !loginMessage) return;
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem('emailForSignIn', email); // Guardar email para completar el inicio de sesión
    loginMessage.textContent = '¡Enlace enviado! Revisa tu correo electrónico (también la carpeta de spam).';
    loginMessage.style.color = 'green';
    emailInput.value = ''; // Limpiar input
  } catch (error) {
    console.error('Error al enviar enlace:', error);
    loginMessage.textContent = `Error: ${error.message}`;
    loginMessage.style.color = 'red';
  }
}

async function completarInicioSesionConEnlace(enlace) {
  if (!loginMessage) return;
  try {
    let email = localStorage.getItem('emailForSignIn');
    if (!email) {
      // Si no hay email guardado, podríamos pedirlo de nuevo.
      // Por ahora, mostraremos un error o pediremos que inicie el proceso de nuevo.
      email = window.prompt('Por favor, ingresa tu correo electrónico para verificar el enlace:');
      if (!email) {
        loginMessage.textContent = 'Inicio de sesión cancelado. No se proporcionó correo.';
        loginMessage.style.color = 'orange';
        window.history.replaceState(null, '', window.location.pathname); // Limpiar URL
        mostrarSeccion('login-section');
        return;
      }
    }

    const result = await signInWithEmailLink(auth, email, enlace);
    localStorage.removeItem('emailForSignIn'); // Limpiar email guardado
    window.history.replaceState(null, '', window.location.pathname); // Limpiar URL del enlace

    const user = result.user;
    const refUsuario = doc(db, 'usuarios', user.uid);
    const docSnap = await getDoc(refUsuario);

    if (!docSnap.exists()) {
      await setDoc(refUsuario, {
        nombre: user.displayName || user.email, // Usar email si no hay displayName
        email: user.email,
        creado: serverTimestamp()
      });
    }
    // updateUIForUser se llamará a través de onAuthStateChanged
    loginMessage.textContent = '¡Inicio de sesión exitoso!';
    loginMessage.style.color = 'green';
    // No es necesario llamar a updateUIForUser aquí, onAuthStateChanged lo hará.
    // Y onAuthStateChanged llamará a mostrarSeccion(defaultSectionId)
  } catch (error) {
    console.error('Error al iniciar sesión con enlace:', error);
    loginMessage.textContent = `Error al iniciar sesión: ${error.message}. Inténtalo de nuevo.`;
    loginMessage.style.color = 'red';
    localStorage.removeItem('emailForSignIn');
    window.history.replaceState(null, '', window.location.pathname); // Limpiar URL
    updateUIForUser(null); // Asegura que se muestre el login form
  }
}

// Al cargar la página, verificar si es un enlace de inicio de sesión
if (isSignInWithEmailLink(auth, window.location.href)) {
    if(loginMessage) loginMessage.textContent = "Verificando enlace...";
    mostrarSeccion('login-section'); // Mostrar sección de login para mensajes y posible input de email
    completarInicioSesionConEnlace(window.location.href);
} else {
    // Carga inicial desde caché (si no es un flujo de enlace de email)
    const cachedDisplayName = localStorage.getItem('cachedUserDisplayName');
    const cachedPhotoURL = localStorage.getItem('cachedUserPhotoURL');
    if (cachedDisplayName || cachedPhotoURL) {
      updateUIForUser({
        displayName: cachedDisplayName,
        photoURL: cachedPhotoURL,
      });
    } else {
        updateUIForUser(null); // No hay usuario, no hay enlace, ocultar todo inicialmente.
                               // login-section se mostrará con click en btnLoginHeader
    }
}


// Estado real del usuario (verifica y actualiza si es necesario)
onAuthStateChanged(auth, (user) => {
  updateUIForUser(user);
  // Si el usuario inicia sesión, se mostrará la sección por defecto dentro de updateUIForUser.
  // Si el usuario cierra sesión, se mostrará la login-section dentro de updateUIForUser.
});

// Logout (igual que antes, pero el modal podría requerir re-vinculación o ajuste)
function showLogoutModal() {
  const modal = document.createElement('div');
  modal.id = 'logout-modal';
  modal.classList.add('modal');
  modal.innerHTML = `
    <div class='modal-content'>
      <h2>Cerrar Sesión</h2>
      <p>¿Estás seguro de que deseas cerrar sesión?</p>
      <div class='modal-buttons'>
        <button id='confirm-logout'>Sí, cerrar sesión</button>
        <button id='cancel-logout'>Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  requestAnimationFrame(() => modal.classList.add('show'));
  document.body.classList.add('modal-open');

  const closeModal = () => {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => modal.remove(), 300);
  };

  // Cerrar modal al hacer scroll (si aplica)
  // const handleScroll = () => closeModal();
  // window.addEventListener('scroll', handleScroll, { once: true });

  document.getElementById('confirm-logout').addEventListener('click', async () => {
    await logoutUsuario();
    closeModal();
  });

  document.getElementById('cancel-logout').addEventListener('click', closeModal);
}

async function logoutUsuario() {
  try {
    await signOut(auth);
    // updateUIForUser(null) será llamado por onAuthStateChanged
    // window.location.reload(); // Considerar si es necesario o si el cambio de sección es suficiente
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

// Event Listeners
if (btnLoginHeader) {
  btnLoginHeader.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      showLogoutModal(); // Mostrar modal de logout si está logueado
    } else {
      mostrarSeccion('login-section'); // Mostrar formulario de login si no está logueado
    }
  });
}

if (btnSendLink && emailInput) {
  btnSendLink.addEventListener('click', () => {
    const email = emailInput.value;
    if (email) {
      enviarEnlace(email);
    } else {
      if(loginMessage) {
        loginMessage.textContent = 'Por favor, ingresa tu correo electrónico.';
        loginMessage.style.color = 'orange';
      }
    }
  });
} else {
    // Esto puede ocurrir si el script se carga antes de que el DOM esté listo para login-section
    // O si los IDs no coinciden. Asegurarse de que el script se carga con defer y los IDs son correctos.
    console.warn('No se encontraron los elementos emailInput o btnSendLink. La funcionalidad de envío de enlace no estará disponible.');
}

// Exportar lo necesario (si otros módulos lo requieren)
export { app, auth, db };
