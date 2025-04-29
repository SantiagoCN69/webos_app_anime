# 🌟 AnimeFLV Lite: WebOS TV Edition 📺

## 🚀 Descripción

- 📺 Aplicación de anime optimizada para TV LG WebOS
- 🚫 Sin anuncios molestos
- 💨 Carga ultrarrápida
- 🎮 Diseñada para control remoto

## 🔧 Instalación en TV LG

### Requisitos Previos
- TV LG con WebOS
- Modo de desarrollador activado
- WebOS CLI Tools

### Paso 1: Activar Modo Desarrollador
1. Ve a Configuración > General > Información de TV
2. Presiona botón de información 7 veces
3. Activa el Modo de Desarrollador

### Paso 2: Generar Paquete IPK
```bash
# Instalar WebOS CLI Tools
npm install -g @webosose/ares-cli

# Crear paquete IPK
ares-package .
```

### Paso 3: Instalar en TV
```bash
# Conectar a la TV (reemplaza IP_TV con IP de tu televisor)
ares-install --device IP_TV anime.flv.lite_1.0.1_all.ipk
```
   ```

## ✨ Características Principales

- **Progressive Web App**: Funciona como una aplicación nativa
- **Caché Inteligente**: Carga instantánea de contenido
- **Diseño Minimalista**: Interfaz limpia y sin distracciones
- **Multiplataforma**: Funciona en móviles, tablets y computadoras

## 🛠 Tecnologías

- HTML5
- CSS3
- Vanilla JavaScript
- Service Workers
- Progressive Web App (PWA)

## 📋 Requisitos

- Node.js 14+
- npm 6+

## 🌐 Origen de los Contenidos

Los animes de esta plataforma son originalmente recopilados del sitio web [AnimeFlV.net](https://animeflv.net), uno de los repositorios más completos y reconocidos de anime en español. 

**Nota Importante**: 
- Este proyecto no aloja contenido directamente
- Todos los derechos de los animes pertenecen a sus respectivos creadores y estudios
- La plataforma sirve como un índice y herramienta de descubrimiento

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor, lee nuestras [guías de contribución](CONTRIBUTING.md).

---

**Disclaimer**: Este proyecto es solo para fines educativos y de entretenimiento.
