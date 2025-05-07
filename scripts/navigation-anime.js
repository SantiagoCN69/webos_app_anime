// navigation-anime.js
document.addEventListener('DOMContentLoaded', () => {
    let focusableElements = []; // Todos los elementos enfocables de la página de anime, incluyendo header
    let currentFocusIndex = -1;   // Índice del elemento actualmente enfocado en focusableElements
    let currentElement = null;    // El elemento HTML actualmente enfocado

    // Selectores de prioridad para el foco inicial. El botón btn-search-capitulo fue eliminado.
    const initialFocusSelectors = [
        '#capitulos button.ep-visto:not([disabled])', // Primer episodio visto
        '#capitulos li:first-child button:not([disabled])', // Primer botón de episodio, sea visto o no
        '#btn-fav:not([disabled])',
        '#btn-estado:not([disabled])',
        '#btn-progreso:not([disabled])',
        '#filtro-capitulo:not([disabled])'
        // btn-search-capitulo ya no existe
    ];

    function updateFocusableElementsPage() {
        const mainSelectors = [
            // Header elements (para poder navegar hacia/desde ellos)
            'header a.title:not([disabled])',
            'header input#busqueda:not([disabled])',
            'header button#btn-close-search:not([disabled])',
            'header button#btn-login:not([disabled])',
            'header button#btn-search:not([disabled])',

            // Anime page specific elements
            '.anime-container1 button:not([disabled])', // #btn-fav, #btn-estado, #btn-progreso
            '.anime-container3 input#filtro-capitulo:not([disabled])',
            '.anime-container3 button#btn-close-search-capitulo:not([disabled])',
            '#capitulos li button:not([disabled])' // Botones de episodio
        ].join(', ');

        focusableElements = Array.from(document.querySelectorAll(mainSelectors))
            .filter(el => {
                const style = window.getComputedStyle(el);
                let parent = el.parentElement;
                let isParentVisible = true;
                while(parent && parent !== document.body) {
                    const parentStyle = window.getComputedStyle(parent);
                    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
                        isParentVisible = false;
                        break;
                    }
                    parent = parent.parentElement;
                }
                return isParentVisible && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetParent !== null;
            });
        // console.log('[nav-anime] Elementos enfocables actualizados:', focusableElements.map(el => el.id || el.tagName));
    }

    function setFocusPage(elementToFocus) {
        if (!elementToFocus || !focusableElements.includes(elementToFocus)) {
            // console.warn('[nav-anime] Elemento no válido o no enfocable para setFocusPage:', elementToFocus);
            // Intentar encontrar el primer elemento visible si el target no es válido
            const firstVisible = focusableElements.find(el => el.offsetParent !== null);
            if (firstVisible) {
                // console.log('[nav-anime] Fallback: enfocando primer elemento visible:', firstVisible);
                elementToFocus = firstVisible;
            } else {
                // console.warn('[nav-anime] No hay elementos visibles para enfocar.');
                return;
            }
        }

        if (currentElement) {
            currentElement.classList.remove('focused');
        }
        
        elementToFocus.classList.add('focused');
        elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        
        currentElement = elementToFocus;
        currentFocusIndex = focusableElements.indexOf(currentElement);
        
        // console.log('[nav-anime] Foco establecido en:', currentElement.id || currentElement.tagName, currentElement);

        // No llamar a .focus() aquí para INPUT/TEXTAREA para evitar teclado automático.
        // El foco nativo se gestionará con Enter en handleAnimePageKeyDown o con clic directo.
        // if (currentElement.tagName === 'INPUT' || currentElement.tagName === 'TEXTAREA') {
        //     // currentElement.focus(); // MOVING THIS LOGIC
        // } else {
        // Para otros elementos como botones, el foco nativo puede ser molesto si no se gestiona el outline
        // currentElement.focus({ preventScroll: true }); // Opcional, si necesitas que el :focus de CSS se aplique
        // }

        // La clase .focused se aplica, pero el teclado solo aparecerá con Enter o clic.
        if (false) { // Mantener la estructura else, pero la condición anterior fue comentada/movida.
            // Para otros elementos como botones, el foco nativo puede ser molesto si no se gestiona el outline
            // currentElement.focus({ preventScroll: true }); // Opcional, si necesitas que el :focus de CSS se aplique
        }
    }
    
    function getVisibleEpisodeButtons() {
        return Array.from(document.querySelectorAll('#capitulos li button:not([disabled])'))
            .filter(btn => btn.offsetParent !== null);
    }

    function getNumberOfColumns() {
        const episodeList = document.getElementById('capitulos');
        const visibleButtons = getVisibleEpisodeButtons();
        if (!episodeList || visibleButtons.length === 0) return 1; // Fallback

        // Intentar determinar columnas basándose en offsetTop de los primeros elementos
        // Esto es más robusto si los anchos de los botones no son perfectamente uniformes
        // o si hay márgenes/padding que afecten el cálculo por ancho.
        let columns = 0;
        const firstButtonTop = visibleButtons[0].offsetTop;
        for (let i = 0; i < visibleButtons.length; i++) {
            if (visibleButtons[i].offsetTop === firstButtonTop) {
                columns++;
            } else {
                break; // Se encontró el primer botón de la siguiente fila
            }
        }
        return columns > 0 ? columns : 1; // Asegurar al menos 1 columna
    }


    function handleAnimePageKeyDown(event) {
        if (!currentElement) { // Si no hay nada enfocado, no hacer nada.
            // console.log("[nav-anime] Keydown sin currentElement.");
            // Intentar establecer un foco inicial si se perdió
            if(focusableElements.length > 0) setFocusPage(focusableElements[0]);
            return;
        }

        let targetElement = null;
        const key = event.key;

        // Elementos de la UI para referencia rápida
        const filtroCapitulo = document.getElementById('filtro-capitulo');
        const btnFav = document.getElementById('btn-fav');
        const btnEstado = document.getElementById('btn-estado');
        const btnProgreso = document.getElementById('btn-progreso');
        const busquedaHeader = document.getElementById('busqueda');
        const btnCloseSearchCapitulo = document.getElementById('btn-close-search-capitulo');

        const visibleEpisodeButtons = getVisibleEpisodeButtons();
        const currentEpisodeIndex = visibleEpisodeButtons.indexOf(currentElement);

        if (key.startsWith('Arrow')) {
            event.preventDefault();

            if (currentElement.closest('#capitulos')) { // Navegación DENTRO de la lista de episodios
                const columns = getNumberOfColumns();
                // console.log("[nav-anime] Columns:", columns);
                if (currentEpisodeIndex !== -1) { // Estamos en un botón de episodio
                    switch (key) {
                        case 'ArrowUp':
                            if (currentEpisodeIndex < columns) { // Primera fila de episodios
                                targetElement = filtroCapitulo;
                            } else {
                                const targetIndex = currentEpisodeIndex - columns;
                                if (targetIndex >= 0) {
                                    targetElement = visibleEpisodeButtons[targetIndex];
                                }
                            }
                            break;
                        case 'ArrowDown':
                            const targetIndexDown = currentEpisodeIndex + columns;
                            if (targetIndexDown < visibleEpisodeButtons.length) {
                                targetElement = visibleEpisodeButtons[targetIndexDown];
                            }
                            break;
                        case 'ArrowLeft':
                            if (currentEpisodeIndex > 0 && (currentEpisodeIndex % columns !== 0)) { // No es el primero de la fila
                                targetElement = visibleEpisodeButtons[currentEpisodeIndex - 1];
                            } else {
                                // Opcional: Navegar a botones laterales si estamos en el primer episodio de una fila
                                targetElement = btnProgreso; // O el último de los tres botones laterales
                            }
                            break;
                        case 'ArrowRight':
                            if (currentEpisodeIndex < visibleEpisodeButtons.length - 1 && ((currentEpisodeIndex + 1) % columns !== 0)) { // No es el último de la fila
                                targetElement = visibleEpisodeButtons[currentEpisodeIndex + 1];
                            }
                            break;
                    }
                }
            } else if (currentElement === filtroCapitulo) {
                switch (key) {
                    case 'ArrowUp':
                        targetElement = busquedaHeader;
                        break;
                    case 'ArrowDown':
                        targetElement = visibleEpisodeButtons.length > 0 ? visibleEpisodeButtons[0] : null;
                        break;
                    case 'ArrowLeft':
                        targetElement = btnFav;
                        break;
                    case 'ArrowRight':
                        targetElement = btnCloseSearchCapitulo && btnCloseSearchCapitulo.offsetParent !== null ? btnCloseSearchCapitulo : (visibleEpisodeButtons.length > 0 ? visibleEpisodeButtons[0] : null) ;
                        break;
                }
            } else if (currentElement === btnCloseSearchCapitulo) {
                 switch (key) {
                    case 'ArrowLeft':
                        targetElement = filtroCapitulo;
                        break;
                    case 'ArrowRight': // Podría ir al primer episodio o quedarse
                         targetElement = visibleEpisodeButtons.length > 0 ? visibleEpisodeButtons[0] : null;
                        break;
                    // Arriba/Abajo podría ir a la búsqueda del header o al primer episodio
                 }
            } else if (currentElement === btnFav) {
                switch (key) {
                    case 'ArrowDown':
                        targetElement = btnEstado;
                        break;
                    case 'ArrowRight':
                        targetElement = visibleEpisodeButtons.length > 0 ? visibleEpisodeButtons[0] : null;
                        break;
                }
            } else if (currentElement === btnEstado) {
                switch (key) {
                    case 'ArrowUp':
                        targetElement = btnFav;
                        break;
                    case 'ArrowDown':
                        targetElement = btnProgreso;
                        break;
                    case 'ArrowRight':
                        targetElement = visibleEpisodeButtons.length > 0 ? visibleEpisodeButtons[0] : null;
                        break;
                }
            } else if (currentElement === btnProgreso) {
                switch (key) {
                    case 'ArrowUp':
                        targetElement = btnEstado;
                        break;
                    case 'ArrowRight':
                        targetElement = visibleEpisodeButtons.length > 0 ? visibleEpisodeButtons[0] : null;
                        break;
                     // ArrowDown podría llevar al primer episodio si es deseable.
                }
            } else if (currentElement === busquedaHeader) { // Desde la búsqueda del header
                if (key === 'ArrowDown') {
                    targetElement = filtroCapitulo;
                }
                // Aquí podrías añadir más lógica para navegar por los otros elementos del header si es necesario
            }
            // Considerar otros elementos del header o la página si se expande la navegación
            
        } else if (key === 'Enter' || key === 'NumpadEnter') {
            event.preventDefault();
            if (currentElement.tagName === 'INPUT' || currentElement.tagName === 'TEXTAREA') {
                currentElement.focus(); // Asegura que el teclado aparezca
                 // Si es el input de filtro y tiene valor, podría "activar" el filtro o no hacer nada.
            } else {
                 currentElement.click();
            }
        }

        if (targetElement) {
            setFocusPage(targetElement);
        }
    }

    function initializeAnimeFocus() {
        updateFocusableElementsPage();
        let targetElement = null;
        // console.log('[nav-anime] Evento episodiosListosParaNavegacion recibido. Iniciando búsqueda de foco inicial...');

        for (const selector of initialFocusSelectors) {
            // console.log("[nav-anime] Intentando selector de prioridad:", selector);
            const potentialElements = Array.from(document.querySelectorAll(selector));
            targetElement = potentialElements.find(el => focusableElements.includes(el) && el.offsetParent !== null);
            if (targetElement) {
                // console.log("[nav-anime] Elemento encontrado con selector de prioridad:", targetElement);
                break; 
            }
        }

        if (!targetElement && focusableElements.length > 0) {
            // console.log("[nav-anime] Fallback: Buscando primer elemento enfocable fuera del header y visible.");
            targetElement = focusableElements.find(el => !el.closest('header') && el.offsetParent !== null) || 
                            focusableElements.find(el => el.offsetParent !== null); // O el primero visible si todos están en header
            // if (targetElement) {
            //      console.log("[nav-anime] Elemento encontrado con Fallback:", targetElement);
            // }
        }

        if (targetElement) {
            setFocusPage(targetElement);
            // Una vez que el foco inicial está listo, añadimos el event listener para la navegación por teclado.
            document.addEventListener('keydown', handleAnimePageKeyDown);
            // console.log('[nav-anime] Foco inicial establecido. Listener de Keydown añadido.');
        } else {
            // console.warn('[nav-anime] No se encontró un elemento inicial para enfocar después de que los episodios estuvieran listos.');
            // Intentar añadir el listener de todas formas por si el foco se establece manualmente o de otra forma
             document.addEventListener('keydown', handleAnimePageKeyDown);
             // console.warn('[nav-anime] Listener de Keydown añadido de todas formas.');
        }
    }

    document.addEventListener('episodiosListosParaNavegacion', initializeAnimeFocus);
    // console.log('[nav-anime] DOMContentLoaded. Esperando evento episodiosListosParaNavegacion.');
});
