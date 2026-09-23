# 1810 — Café Resto Bar

Landing inmersiva con scroll cinematográfico para **1810**, una ex estación de
servicio YPF art-decó en Tres Arroyos reconvertida en café/resto/bar.

A medida que se scrollea, la cámara "vuela" de escena en escena sin cortes:
fachada → barra → comedor → patio → cierre. Es un sitio estático (HTML/CSS/JS
vanilla, sin build ni dependencias) — abrir `index.html` alcanza.

## Cómo correrlo localmente

```bash
python -m http.server 8811
# abrir http://localhost:8811
```

(Necesita servirse por HTTP, no `file://`, para que el scroll-scrub de los
videos funcione bien en todos los navegadores.)

## Estructura

```
index.html        estructura de las escenas
css/style.css      identidad art-decó, layout, crossfades
js/main.js         motor de scroll: liga la posición de scroll al
                   currentTime de cada video (o a un Ken Burns simulado
                   para las fotos) + crossfade entre escenas
assets/video/      clips de cámara por escena (fachada, barra, comedor)
assets/img/        fotos reales del lugar + posters de los videos
assets/ai-refs/    tomas maestras originales generadas por IA (fuente de
                   los clips ya recortados en assets/video/)
```

## Cómo se generan las escenas de video

Cada escena de video es un tramo recortado de **una sola toma continua**
generada con IA (Nano Banana para la imagen inicial, Veo para la cámara),
partiendo siempre del **último frame real** de la escena anterior — nunca de
una imagen nueva — para que el corte entre escenas sea matemáticamente el
mismo frame en ambos lados. `js/main.js` liga el `currentTime` del video a la
posición de scroll, así el "vuelo" se recorre hacia adelante y hacia atrás
igual de bien.

## Estado

- ✅ Fachada, Barra, Comedor — video real generado con IA
- ⏳ Patio ("La llegada") y Cierre (torre YPF) — foto real por ahora
