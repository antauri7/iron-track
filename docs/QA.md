# Verificación — 25/11/2026

## Compilación

`npm run build`: aprobada. TypeScript estricto y build Vite con manifiesto, iconos y precaché. Build total aproximado: 1.1 MB sin comprimir. No quedaron avisos de bundles superiores a 500 kB tras dividir pantallas.

## Pruebas unitarias

`npm test`: 19 aprobadas. Cubren distribución de 113 series, volúmenes directos, snapshots, unilateralidad, descendentes, mancuernas, comparabilidad de equipos, doble progresión, aproximaciones, e1RM, temporizador, semana/fecha mexicana, persistencia, validación de respaldos, estimador de tiempo, tendencias y conservación de estado desde esquema v1 a v3.

## Pruebas funcionales

`npm run test:e2e`: 26 aprobadas, 13 en Chromium y 13 en WebKit. Incluyen registro y recuperación de sesión, snapshot tras editar plantilla, navegación y desbordes a 360/390/430/768/1024/1440 px, recarga offline, medidas parciales, exportación/restauración e importación inválida, recuperación e informes, fotografías locales y comparación.

La prueba de fotografías se amplió después de esa ejecución para incluir respaldo y restauración de sus datos binarios; se volvió a ejecutar de forma dirigida en ambos navegadores. Durante la primera ejecución se encontró un fallo Blob/IndexedDB en WebKit, corregido guardando ArrayBuffer y MIME. El formato de lectura mantiene compatibilidad con Blob previos.

## Otras comprobaciones

- `npm audit --audit-level=moderate`: sin vulnerabilidades reportadas al finalizar.
- Revisión visual mediante capturas de escritorio, móvil y entrenamiento activo.
- Inspección de recursos: no se incorporan capturas del usuario, fotos protegidas ni datos personales al build.
- El workflow de Pages está escrito, pero no se ejecutó en GitHub porque no hay remoto de destino configurado.

## No verificado

Instalación en teléfonos físicos, despliegue público, actualización entre dos versiones de producción distintas, todas las variantes del entrenamiento, recuperación tras error de cuota, uso concurrente en pestañas y auditoría completa de accesibilidad. No se presentan como pruebas aprobadas.
