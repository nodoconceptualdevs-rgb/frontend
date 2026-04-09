# 🎨 Sistema de Colores BYNODO

## 📍 Archivo de Configuración
**Ubicación**: `src/app/(public)/bynodo/bynodo-variables.css`

## ✨ Cómo cambiar los colores de TODA la aplicación

### 1. Abre el archivo de variables:
```
src/app/(public)/bynodo/bynodo-variables.css
```

### 2. Modifica los valores que necesites:

```css
:root {
  /* === FONDOS === */
  --bynodo-bg-primary: #2a2a2a;      /* Fondo principal de toda la app */
  --bynodo-bg-secondary: #424242;    /* Cards y sección de contacto */
  
  /* === TEXTOS === */
  --bynodo-text-primary: #ffffff;    /* Títulos principales */
  --bynodo-text-secondary: #e0e0e0;  /* Texto en contacto */
  --bynodo-text-muted: #c0c0c0;      /* Descripciones */
  --bynodo-text-label: #808080;      /* Labels pequeños */
  
  /* === ACENTOS === */
  --bynodo-accent: #d4af6a;          /* Botones, títulos dorados */
  --bynodo-accent-hover: #c9a569;    /* Hover de botones */
  --bynodo-accent-light: #e0bb76;    /* Variante clara */
}
```

## 🎯 Dónde se aplican estos colores

### `--bynodo-bg-primary` (#2a2a2a)
- ✅ Fondo general de todas las páginas
- ✅ Menú superior
- ✅ Contenedor principal de RestaurantDetail
- ✅ Sección de título del restaurante
- ✅ Sección de espacios (carrusel)

### `--bynodo-bg-secondary` (#424242)
- ✅ Cards de restaurantes en la lista
- ✅ Sección de información de contacto (la única destacada)

### `--bynodo-accent` (#d4af6a)
- ✅ Botones "Ver más"
- ✅ Nombre de restaurantes
- ✅ Íconos de contacto
- ✅ Hover de links

## 🔧 Archivos que usan este sistema

1. `bynodo.css` - Layout global
2. `page.module.css` - Página principal BYNODO
3. `[slug]/page.module.css` - Página de detalle
4. `RestaurantDetail.module.css` - Componente de detalle
5. `RestaurantsSection.module.css` - Lista de restaurantes

## 💡 Ventajas de este sistema

- **Un solo lugar**: Cambia un color y afecta toda la app
- **Documentado**: Cada variable tiene comentarios explicativos
- **Consistente**: No más colores hardcoded por todos lados
- **Fácil de mantener**: Encuentra bugs de color rápidamente

## 🚀 Ejemplo de cambio

**Quiero un fondo más claro:**
```css
/* Antes */
--bynodo-bg-primary: #2a2a2a;

/* Después */
--bynodo-bg-primary: #3a3a3a;
```

¡Y listo! Todo se actualiza automáticamente.

## ⚠️ Importante

- NO modifiques los colores directamente en los archivos `.module.css`
- SIEMPRE usa el archivo de variables
- Los cambios se aplican instantáneamente (sin recargar)
