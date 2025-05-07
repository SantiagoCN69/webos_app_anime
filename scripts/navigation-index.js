// five-way-navigation.js
// Maneja la navegación de 5 vías (arriba, abajo, izquierda, derecha, OK/Enter).

document.addEventListener('DOMContentLoaded', () => {
    let focusableElements = [];
    let currentFocusIndex = 0;
    let activeContainer = null; // Contenedor activo para la navegación (opcional)
    let lastFocusedSidebarElement = null; // Guarda el último elemento enfocado en el sidebar

    // --- INICIALIZACIÓN ---
    function initializeNavigation() {
        updateFocusableElements();
        if (focusableElements.length > 0) {
            // Intenta enfocar el primer elemento del sidebar si existe y es enfocable
            const sidebar = document.getElementById('sidebar');
            let firstFocusable = focusableElements[0];
            if (sidebar) {
                const firstInSidebar = Array.from(
                    sidebar.querySelectorAll('li[data-target]')
                ).find(el => focusableElements.includes(el));
                if (firstInSidebar) {
                    firstFocusable = firstInSidebar;
                }
            }
            setFocus(firstFocusable);
        }
    }

    // --- MANEJO DEL FOCO ---
    function setFocus(element) {
        if (!element) return;

        const currentFocused = document.querySelector('.focused');
        if (currentFocused) {
            // Si el elemento que pierde el foco estaba en el sidebar, lo guardamos
            if (currentFocused.closest('section.sidebar')) {
                lastFocusedSidebarElement = currentFocused;
            }
            currentFocused.classList.remove('focused');
            currentFocused.blur(); // Quitar el foco nativo si lo tiene
        }

        element.classList.add('focused');
        // No llamar a element.focus() aquí directamente para evitar problemas con scroll o comportamiento nativo no deseado.
        // La clase 'focused' es la que usamos para nuestro manejo visual y lógico del foco.
        // Si se necesita foco nativo para ciertos elementos (inputs), se manejará específicamente.
        currentFocusIndex = focusableElements.indexOf(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

        // Guardar el ID del elemento enfocado para restaurarlo en la próxima carga (opcional)
        // if (element.id) {
        //     localStorage.setItem('lastFocusedElementId', element.id);
        // }

        // Click automático en LI del sidebar con data-target
        if (element.tagName === 'LI' && element.hasAttribute('data-target') && element.closest('section.sidebar ul')) {
            element.click();
        }
    }

    // --- ACTUALIZAR ELEMENTOS ENFOCABLES ---
    function updateFocusableElements(container = document) {
        focusableElements = Array.from(
            container.querySelectorAll(
                'button:not([disabled]), a[href]:not([disabled]):not(header a.title), input:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]):not(header a.title), .navigable:not([disabled]):not(header a.title), section.sidebar ul li[data-target]'
            )
        ).filter(el => {
            const style = window.getComputedStyle(el);
            // Asegurarse que el elemento sea visible y su contenedor también
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
            return isParentVisible && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });

        if (focusableElements.length > 0) {
            const currentFocusedElement = document.querySelector('.focused');
            if (!currentFocusedElement || !focusableElements.includes(currentFocusedElement)) {
                let newIndex = focusableElements.indexOf(currentFocusedElement_beforeUpdate);
                if (newIndex === -1 || newIndex >= focusableElements.length) {
                    newIndex = 0; // default to first if not found or out of bounds
                }
                 // No llamar a setFocus aquí directamente para evitar bucles con el observer, se manejará en el observer
            } else {
                 currentFocusIndex = focusableElements.indexOf(currentFocusedElement); // Actualizar índice si el elemento enfocado sigue siendo válido
            }
        } else {
            currentFocusIndex = -1; // No hay elementos enfocables
        }
    }
    let currentFocusedElement_beforeUpdate = null; // Para ayudar al observer


    // --- MANEJO DE EVENTOS DE TECLADO ---
    document.addEventListener('keydown', (event) => {
        if (focusableElements.length === 0) return;
        const currentElement = focusableElements[currentFocusIndex];
        if (!currentElement) return; // Si no hay elemento actual, no hacer nada

        let targetElement = null;
        let handledByGrid = false;

        // Lógica de Navegación del Grid
        const grid = currentElement.closest('.grid-animes');
        if (grid) {
            const cards = Array.from(grid.querySelectorAll('.anime-card')) // Asumimos que .anime-card son los items del grid
                                .filter(el => focusableElements.includes(el)); // Solo las que son realmente enfocables
            
            if (cards.length > 0) {
                let currentIndexInGrid = cards.indexOf(currentElement);
                const columns = parseInt(grid.dataset.columns) || 5;
                let row = Math.floor(currentIndexInGrid / columns);
                let col = currentIndexInGrid % columns;

                switch (event.key) {
                    case 'ArrowRight':
                        if (col < columns - 1 && currentIndexInGrid + 1 < cards.length) {
                            targetElement = cards[currentIndexInGrid + 1];
                        }
                        handledByGrid = true;
                        break;
                    case 'ArrowLeft':
                        if (col > 0) {
                            targetElement = cards[currentIndexInGrid - 1];
                        } else if (lastFocusedSidebarElement && focusableElements.includes(lastFocusedSidebarElement)) {
                            // Volver al último elemento del sidebar enfocado
                            targetElement = lastFocusedSidebarElement;
                        }
                        handledByGrid = true;
                        break;
                    case 'ArrowDown':
                        const targetDownIndex = currentIndexInGrid + columns;
                        if (targetDownIndex < cards.length) {
                            targetElement = cards[targetDownIndex];
                        }
                        handledByGrid = true;
                        break;
                    case 'ArrowUp':
                        const searchInput = document.getElementById('busqueda');
                        if (row === 0 && searchInput && focusableElements.includes(searchInput)) {
                            targetElement = searchInput;
                        } else {
                            const targetUpIndex = currentIndexInGrid - columns;
                            if (targetUpIndex >= 0) {
                                targetElement = cards[targetUpIndex];
                            }
                        }
                        handledByGrid = true;
                        break;
                }
            }
        }

        if (handledByGrid) {
            if (targetElement) {
                setFocus(targetElement);
                event.preventDefault();
            }
            return; // La navegación del grid manejó el evento (o decidió no hacer nada)
        }

        // Lógica de Navegación General y Sidebar (si no fue manejada por el grid)
        const headerSearch = document.getElementById('busqueda');
        const headerLogin = document.getElementById('btn-login');
        const sidebarLiElements = Array.from(document.querySelectorAll('section.sidebar ul li[data-target]'));
        const sidebarItems = sidebarLiElements.filter(el => focusableElements.includes(el));
        sidebarItems.sort((a, b) => focusableElements.indexOf(a) - focusableElements.indexOf(b));

        const isHeaderSearchFocused = currentElement === headerSearch;
        const isHeaderLoginFocused = currentElement === headerLogin;
        const isSidebarElementFocused = sidebarItems.includes(currentElement);
        let currentIndexInSidebar = isSidebarElementFocused ? sidebarItems.indexOf(currentElement) : -1;

        switch (event.key) {
            case 'ArrowUp':
                if (isSidebarElementFocused && currentIndexInSidebar > 0) {
                    targetElement = sidebarItems[currentIndexInSidebar - 1];
                } else if (currentFocusIndex > 0) {
                    targetElement = focusableElements[currentFocusIndex - 1]; // Fallback general
                }
                break;
            case 'ArrowDown':
                if (isSidebarElementFocused && currentIndexInSidebar < sidebarItems.length - 1) {
                    targetElement = sidebarItems[currentIndexInSidebar + 1];
                } else if (currentFocusIndex < focusableElements.length - 1) {
                    targetElement = focusableElements[currentFocusIndex + 1]; // Fallback general
                }
                break;
            case 'ArrowLeft':
                if (isHeaderLoginFocused && headerSearch && focusableElements.includes(headerSearch)) {
                    targetElement = headerSearch;
                } else if (isSidebarElementFocused) {
                     // Si está en el sidebar y presiona izquierda, podría ir al header si corresponde
                    if (currentIndexInSidebar === 0 && headerLogin && focusableElements.includes(headerLogin)) {
                         targetElement = headerLogin; // Del primer item del sidebar al login
                    } else if (headerSearch && focusableElements.includes(headerSearch)) {
                        // Opcional: si no hay login, o desde cualquier item del sidebar, ir a búsqueda
                        // targetElement = headerSearch;
                    }
                } else if (currentFocusIndex > 0) {
                    //targetElement = focusableElements[currentFocusIndex - 1]; // Fallback general
                    // No hacer nada o buscar el elemento espacialmente más cercano a la izquierda.
                    // Por ahora, nos enfocamos en la navegación del grid y sidebar.
                }
                break;
            case 'ArrowRight':
                if (isSidebarElementFocused) {
                    const targetSectionId = currentElement.dataset.target;
                    if (targetSectionId) {
                        const targetSection = document.getElementById(targetSectionId);
                        if (targetSection) {
                            let potentialTargetsInSec = Array.from(
                                targetSection.querySelectorAll(
                                    '.anime-card, button:not([disabled]), a[href]:not([disabled]):not(header a.title), input:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]):not(header a.title), .navigable:not([disabled]):not(header a.title)'
                                )
                            ).filter(el => focusableElements.includes(el));
                            potentialTargetsInSec.sort((a, b) => focusableElements.indexOf(a) - focusableElements.indexOf(b));
                            if (potentialTargetsInSec.length > 0) {
                                targetElement = potentialTargetsInSec[0];
                            }
                        }
                    }
                    // Si no hay targetSection o no hay elementos en ella, no se mueve (o se podría definir un fallback)
                } else if (isHeaderSearchFocused && headerLogin && focusableElements.includes(headerLogin)) {
                    targetElement = headerLogin;
                } else if (isHeaderLoginFocused && sidebarItems.length > 0 && sidebarItems[0] && focusableElements.includes(sidebarItems[0])) {
                    targetElement = sidebarItems[0];
                } else if (currentFocusIndex < focusableElements.length - 1) {
                    // targetElement = focusableElements[currentFocusIndex + 1]; // Fallback general
                    // No hacer nada o buscar el elemento espacialmente más cercano a la derecha.
                }
                break;
            case 'Enter':
            case 'NumpadEnter': // Para algunos webOS remote
                if (currentElement) {
                    if (currentElement.id === 'busqueda' && currentElement.tagName === 'INPUT') {
                        currentElement.focus(); // Asegura que el teclado aparezca para el input de búsqueda
                    }
                    currentElement.click(); // Ejecuta el click para otros comportamientos asociados
                }
                break;
            default:
                return; // No hacer nada para otras teclas
        }

        if (targetElement) {
            setFocus(targetElement);
            event.preventDefault();
        } else if ((event.key === 'Enter' || event.key === 'NumpadEnter') && currentElement) {
            event.preventDefault(); // Prevenir si se hizo click
        }
    });

    // --- OBSERVAR CAMBIOS EN EL DOM ---
    const observer = new MutationObserver((mutationsList, obs) => {
        currentFocusedElement_beforeUpdate = document.querySelector('.focused');
        updateFocusableElements(activeContainer || document);
        const currentFocusedElement = document.querySelector('.focused');

        if (focusableElements.length > 0) {
            if (!currentFocusedElement || !focusableElements.includes(currentFocusedElement)) {
                // Si el elemento previamente enfocado (antes del updateFocusableElements) sigue siendo válido, intentar re-enfocarlo.
                if (currentFocusedElement_beforeUpdate && focusableElements.includes(currentFocusedElement_beforeUpdate)) {
                    setFocus(currentFocusedElement_beforeUpdate);
                } else {
                    // Fallback: enfocar el primer elemento disponible, o el más cercano al índice anterior
                    let newFocusIndex = currentFocusIndex;
                    if (newFocusIndex < 0 || newFocusIndex >= focusableElements.length) {
                        newFocusIndex = 0;
                    }
                    if (focusableElements[newFocusIndex]) {
                       setFocus(focusableElements[newFocusIndex]);
                    } else if (focusableElements.length > 0) {
                       setFocus(focusableElements[0]);
                    }
                }
            } else {
                 // El elemento enfocado sigue siendo válido, solo asegurarse que el índice es correcto
                 currentFocusIndex = focusableElements.indexOf(currentFocusedElement);
            }
        } else if (currentFocusedElement) {
            currentFocusedElement.classList.remove('focused');
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'disabled', 'tabindex'] });
    
    initializeNavigation();
});
