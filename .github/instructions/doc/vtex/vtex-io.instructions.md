# Instrucción para Documentación de Componentes VTEX IO

**Importante:**  
Cuando generes la documentación de un componente, debes consultar y aplicar los lineamientos generales definidos en `./documentation.instructions.md`. Posteriormente, aplica los lineamientos y ejemplos específicos de este archivo para proyectos VTEX IO.

## Objetivo

Establecer una guía clara y estructurada para la documentación de componentes y servicios en proyectos VTEX IO, asegurando que se incluyan tanto los aspectos técnicos de los componentes, como la integración y configuración en el tema VTEX y documentación de servicios adicionales.

## Identificación de proyectos VTEX IO

Un proyecto se considera VTEX IO si cumple con ambos requisitos:

- Contiene el archivo `manifest.json` en la raíz.
- Existe la carpeta `store` con el archivo `interfaces.json`.

## Documentación de Props de Componentes

Para cada componente:

1. Analiza las props que recibe el componente.
2. Documenta cada prop en una tabla, usando el siguiente formato:

   | Prop name | Type | Default value | Description |
   | --------- | ---- | ------------- | ----------- |
   | nombre    | tipo | valor         | descripción |

3. Incluye una tabla por cada grupo de props relevante (por ejemplo, atributos condicionales o agrupados por funcionalidad).
4. En cada propiedad, detalla:
   - Nombre
   - Tipo
   - Valor por defecto (si aplica)
   - Breve descripción de su función
