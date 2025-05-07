// navigation-ver.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Navigation for ver.html loaded');

    let focusableElements = [];
    let currentElement = null;

    // Prioridad para el foco inicial en la página de reproducción
    const initialFocusSelectorsVer = [
        '#controles button:first-of-type:not([disabled])', // Primer botón de control del video
        '#btn-volver-anime:not([disabled])',
        '#btn-estado-capitulo:not([disabled])',
        '#fullscreen:not([disabled])'
    ];

    function updateFocusableElementsVerPage() {
        const mainSelectors = [
            // Header elements
            'header a.title:not([disabled])',
            'header input#busqueda:not([disabled])',
            'header button#btn-close-search:not([disabled])',
            'header button#btn-login:not([disabled])',
            'header button#btn-search:not([disabled])',

            // Ver page specific elements
            '#btn-volver-anime:not([disabled])',
            '#btn-estado-capitulo:not([disabled])',
            '#controles button:not([disabled])', // Botones dentro de los controles del video
            '#fullscreen:not([disabled])',
            // Botones de la sección .botones-reproductor
            '#btn-bloquear-anuncios:not([disabled])',
            '#btn-censura:not([disabled])',
            '#btn-anterior-capitulo:not([disabled])',
            '#btn-siguiente-capitulo:not([disabled])'
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
        console.log('[nav-ver] Elementos enfocables actualizados:', focusableElements.map(el => el.id || el.tagName || el.outerHTML.substring(0,50)));
    }

    function setFocusVerPage(elementToFocus) {
        if (!elementToFocus || !focusableElements.includes(elementToFocus)) {
            // console.warn('[nav-ver] Elemento no válido o no enfocable para setFocusVerPage:', elementToFocus);
            const firstVisible = focusableElements.find(el => el.offsetParent !== null);
            if (firstVisible) {
                elementToFocus = firstVisible;
            } else {
                return;
            }
        }

        if (currentElement) {
            currentElement.classList.remove('focused');
        }
        
        elementToFocus.classList.add('focused');
        elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        
        currentElement = elementToFocus;
        // console.log('[nav-ver] Foco establecido en:', currentElement.id || currentElement.tagName, currentElement);

        // No llamar a .focus() aquí para INPUT/TEXTAREA para evitar teclado automático.
        // El foco nativo se gestionará con Enter en handleVerPageKeyDown o con clic directo.
    }

    function handleVerPageKeyDown(event) {
        console.log('[NAV_DEBUG] focusableElements:', focusableElements.map(el => el.id || el.tagName));
        if (!focusableElements.length) return;
        if (!currentElement) {
            setFocusVerPage(focusableElements[0]);
            return;
        }

        let targetElement = null;
        const key = event.key;

        // Obtener referencias a los elementos específicos para las reglas de navegación
        const fsButton = document.getElementById('fullscreen');
        const prevEpButton = document.getElementById('btn-anterior-capitulo');
        const nextEpButton = document.getElementById('btn-siguiente-capitulo');
        const censuraButton = document.getElementById('btn-censura');
        const adblockButton = document.getElementById('btn-bloquear-anuncios');
        const volverAnimeButton = document.getElementById('btn-volver-anime');
        const serverContainer = document.getElementById('controles');
        const firstServerButton = serverContainer ? serverContainer.querySelector('button:not([disabled])') : null;
        const lastServerButton = serverContainer ? Array.from(serverContainer.querySelectorAll('button:not([disabled])')).pop() : null;

        console.log('[NAV_DEBUG] Element Refs:', {
            fsButton: fsButton ? fsButton.id : null,
            prevEpButton: prevEpButton ? prevEpButton.id : null,
            nextEpButton: nextEpButton ? nextEpButton.id : null,
            censuraButton: censuraButton ? censuraButton.id : null,
            adblockButton: adblockButton ? adblockButton.id : null,
            volverAnimeButton: volverAnimeButton ? volverAnimeButton.id : null,
            firstServerButton: firstServerButton ? firstServerButton.id : null,
            lastServerButton: lastServerButton ? lastServerButton.id : null
        });

        console.log(`[NAV_DEBUG] Key: ${event.key}, CurrentElement: ${currentElement ? (currentElement.id || currentElement.tagName) : 'null'}`);

        // Detener el comportamiento por defecto para las flechas si vamos a manejarlo
        if (key.startsWith('Arrow')) {
            event.preventDefault();
        }

        if (key === 'ArrowRight') {
            if (currentElement.parentElement === serverContainer) {
                const serverButtons = Array.from(serverContainer.querySelectorAll('button:not([disabled])')).filter(btn => focusableElements.includes(btn));
                const currentIndexInServers = serverButtons.indexOf(currentElement);
                if (currentIndexInServers < serverButtons.length - 1) {
                    targetElement = serverButtons[currentIndexInServers + 1];
                }
            }
            else if (currentElement === fsButton && focusableElements.includes(prevEpButton)) targetElement = prevEpButton;
            else if (currentElement === prevEpButton && focusableElements.includes(nextEpButton)) targetElement = nextEpButton;
        } else if (key === 'ArrowLeft') {
            if (currentElement.parentElement === serverContainer) {
                const serverButtons = Array.from(serverContainer.querySelectorAll('button:not([disabled])')).filter(btn => focusableElements.includes(btn));
                const currentIndexInServers = serverButtons.indexOf(currentElement);
                if (currentIndexInServers > 0) {
                    targetElement = serverButtons[currentIndexInServers - 1];
                }
            }
            // Nueva regla: Desde btn-siguiente-capitulo a btn-anterior-capitulo con ArrowLeft
            else if (currentElement === nextEpButton && focusableElements.includes(prevEpButton)) {
                targetElement = prevEpButton;
            }
            // Regla modificada: Desde btn-anterior-capitulo a fullscreen con ArrowLeft
            else if (currentElement === prevEpButton && focusableElements.includes(fsButton)) {
                targetElement = fsButton;
            }
            // Nueva regla: Desde btn-censura a fullscreen con ArrowLeft
            else if (currentElement === censuraButton && focusableElements.includes(fsButton)) {
                targetElement = fsButton;
            }
            else if ((currentElement === adblockButton || currentElement === censuraButton) && focusableElements.includes(firstServerButton)) targetElement = firstServerButton;
        } else if (key === 'ArrowUp') {
            if ((currentElement === prevEpButton || currentElement === nextEpButton) && focusableElements.includes(censuraButton)) targetElement = censuraButton;
            else if (currentElement === censuraButton && focusableElements.includes(adblockButton)) targetElement = adblockButton;
            else if (currentElement.parentElement === serverContainer && focusableElements.includes(volverAnimeButton)) targetElement = volverAnimeButton;
            else if (currentElement === fsButton && focusableElements.includes(lastServerButton)) targetElement = lastServerButton;
            // else: Lógica general de ArrowUp (anterior en la lista)
        } else if (key === 'ArrowDown') {
            if (currentElement === volverAnimeButton && focusableElements.includes(firstServerButton)) {
                targetElement = firstServerButton;
            }
            // Nueva regla: Desde adblockButton a censuraButton con ArrowDown
            else if (currentElement === adblockButton && focusableElements.includes(censuraButton)) {
                targetElement = censuraButton;
            }
            // Nueva regla: Desde censuraButton a prevEpButton con ArrowDown
            else if (currentElement === censuraButton && focusableElements.includes(prevEpButton)) {
                targetElement = prevEpButton;
            }
            else if (currentElement.parentElement === serverContainer && focusableElements.includes(fsButton)) {
                targetElement = fsButton;
            }
        }

        // Fin de las reglas específicas de navegación con flechas

        console.log(`[NAV_DEBUG] After arrow logic - TargetElement: ${targetElement ? (targetElement.id || targetElement.tagName) : 'null'}`);

        if (key === 'Enter' && currentElement && typeof currentElement.click === 'function') {
            event.preventDefault();
            currentElement.click();
        }

        if (targetElement && focusableElements.includes(targetElement)) {
            console.log('[NAV_DEBUG] Setting focus to:', targetElement.id || targetElement.tagName);
            setFocusVerPage(targetElement);
        } else if (targetElement) {
            console.warn('[NAV_DEBUG] TargetElement was found, but NOT IN focusableElements or is invalid:', targetElement.id || targetElement.tagName, 'Is in focusableElements:', focusableElements.includes(targetElement));
        } else if (key.startsWith('Arrow')){
            console.log('[NAV_DEBUG] No specific rule applied or no targetElement found for key:', key, 'from:', currentElement.id || currentElement.tagName);
        }
    }

    function initializeVerFocus() {
        updateFocusableElementsVerPage();
        let targetElement = null;
        // console.log('[nav-ver] Evento controlesVideoListos recibido. Iniciando búsqueda de foco inicial...');

        for (const selector of initialFocusSelectorsVer) {
            const potentialElements = Array.from(document.querySelectorAll(selector));
            targetElement = potentialElements.find(el => focusableElements.includes(el) && el.offsetParent !== null);
            if (targetElement) break;
        }

        if (!targetElement && focusableElements.length > 0) {
            targetElement = focusableElements.find(el => !el.closest('header') && el.offsetParent !== null) || 
                            focusableElements.find(el => el.offsetParent !== null);
        }

        if (targetElement) {
            setFocusVerPage(targetElement);
        }
    }

    // Esperar a que los controles del video estén listos (evento debe ser disparado desde ver.js)
    document.addEventListener('controlesVideoListos', initializeVerFocus);

    // Fallback si el evento no se dispara o para pruebas iniciales sin el evento
    // setTimeout(initializeVerFocus, 500); // Considera quitarlo una vez que 'controlesVideoListos' esté implementado en ver.js

    console.log('[nav-ver] DOMContentLoaded. Esperando evento controlesVideoListos.');
    document.addEventListener('keydown', handleVerPageKeyDown);
});

