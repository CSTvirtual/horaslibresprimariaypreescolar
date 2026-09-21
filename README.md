# Portal de disponibilidad docente — versión 2

Portal web estático para consultar la disponibilidad de profesores de **Preescolar y Primaria** del Colegio San Tarsicio.

## Fuentes integradas

- Horario de Preescolar 2026–2027.
- Horario de Primaria 2026–2027.
- Horario de Bachillerato 2026–2027.
- Listado de profesores, asignaturas, cursos y jornada laboral.

Bachillerato no es una sección de consulta principal. Se usa internamente para evitar mostrar como libre a un profesor de Preescolar/Primaria cuando está dando clase en Bachillerato.

## Reglas aplicadas

1. Filas del listado sin nombre heredan el profesor de la fila anterior.
2. Las jornadas terminadas en `4.01`, `4.02`, etc. se normalizan a **4:00 p. m.**
3. `Scince` se normaliza como **Science**.
4. Se normalizan variantes como `Arte/Artes`, `Ed. Física/Educación Física` y abreviaturas.
5. Los bloques `Inglés R/W` de Primaria se asignan a la directora de grupo:
   - Primero: Sandra S
   - Segundo: Luisa D
   - Tercero: Natalia U
   - Cuarto: Ana María
   - Quinto: Patricia R

## Estados del portal

- **Disponible**: dentro de la jornada y sin clase identificada.
- **En clase**: existe una asignación única profesor + curso + asignatura.
- **Por confirmar**: más de un profesor del listado puede corresponder al mismo bloque. Se usa principalmente en algunos bloques de Inglés de Primaria.
- **Fuera de jornada**: el profesor no trabaja ese día/hora según el listado.

## Advertencia importante

`Disponible` significa **sin clase identificada en los archivos suministrados**. No contempla reuniones, reemplazos, turnos, acompañamientos u otras funciones que no aparezcan en las fuentes.

En Preescolar, `Trabajo manual` e `Integración` se asignan a la directora de cada grupo:

- Prejardín A: Laura
- Prejardín B: Juliana
- Jardín A: Betty
- Jardín B: Daniela A
- Transición A: Gina A
- Transición B: Alejandra

`Actividad dirigida` y `Recreación` todavía no tienen un docente identificado en las fuentes, así que el portal muestra una advertencia cuando la consulta coincide con uno de esos bloques.

## Archivos

```text
portal-profesores-v2/
├── index.html
├── styles.css
├── data.js
├── app.js
└── README.md
```

## Publicación en GitHub Pages

1. Crea o abre el repositorio en GitHub.
2. Sube los cinco archivos a la raíz.
3. Ve a **Settings → Pages**.
4. En **Build and deployment** selecciona `Deploy from a branch`.
5. Selecciona `main` y `/ (root)`.
6. Guarda.

No requiere Node, npm, servidor ni base de datos.


## Cambios de la versión 3

- Se añadió una vista **Horario del colegio por docentes**.
- Permite escoger `Lunes–Viernes` y `Primaria/Preescolar`.
- La tabla conserva las franjas y cursos, pero muestra **nombres de profesores en lugar de asignaturas**.
- En Inglés de Primaria, cuando hay tres profesoras asignadas al mismo curso, aparecen las tres porque el curso se divide simultáneamente en tres grupos.
- Nicolás B está configurado como **fuera de jornada los lunes**.
- Si un dato genera un cruce de horario entre dos asignaciones exactas, la tabla lo marca con `⚠ cruce` para revisarlo en vez de ocultarlo.

### Equipos de Inglés de Primaria

- Primero: Sandra S · Luisa D · Ana María
- Segundo: Sandra S · Luisa D · Natalia U
- Tercero: Natalia U · Patricia R · Daniela Lenis
- Cuarto: Natalia U · Ana María · Patricia R
- Quinto: Ana María · Patricia R · Viviana
