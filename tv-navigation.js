document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.content-grid');
    const items = Array.from(grid.querySelectorAll('.content-item'));
    let currentIndex = 0;

    // Asegurarse de que siempre haya 5 columnas
    function ensureFiveColumns() {
        const gridWidth = grid.clientWidth;
        const itemWidth = items[0].clientWidth;
        const columnsCount = Math.min(5, Math.max(1, Math.floor(gridWidth / (itemWidth + 20))));
        grid.style.gridTemplateColumns = `repeat(${columnsCount}, 1fr)`;
    }

    // Función para manejar la navegación
    function navigateGrid(direction) {
        // Quitar foco del elemento actual
        if (items[currentIndex]) {
            items[currentIndex].classList.remove('focused');
        }

        // Calcular nuevo índice según la dirección
        switch(direction) {
            case 'ArrowRight':
                currentIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowLeft':
                currentIndex = (currentIndex - 1 + items.length) % items.length;
                break;
            case 'ArrowDown':
                currentIndex = Math.min(currentIndex + 5, items.length - 1);
                break;
            case 'ArrowUp':
                currentIndex = Math.max(currentIndex - 5, 0);
                break;
        }

        // Añadir foco al nuevo elemento
        items[currentIndex].classList.add('focused');
        items[currentIndex].focus();
        items[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Evento para manejar teclas del control remoto
    document.addEventListener('keydown', (event) => {
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            navigateGrid(event.key);
        }
    });

    // Añadir tabindex para hacer elementos navegables
    items.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.addEventListener('focus', () => {
            currentIndex = index;
        });
    });

    // Asegurar 5 columnas al cargar y al redimensionar
    ensureFiveColumns();
    window.addEventListener('resize', ensureFiveColumns);

    // Seleccionar primer elemento por defecto
    if (items.length > 0) {
        items[0].classList.add('focused');
    }
});
