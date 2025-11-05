# AWS Lambda CodeDeploy Pipeline

Este repositorio utiliza un workflow de GitHub Actions llamado **CI Pipeline** para automatizar la validación y despliegue del servicio Serverless. La secuencia completa del pipeline es la siguiente:

1. **Lint** (`npm run lint`): valida el estilo y la calidad del código con ESLint.
2. **Test** (`npm test`): ejecuta la batería de pruebas automatizadas con Jest.
3. **Build** (`serverless package`): genera el artefacto empaquetado del servicio y lo publica como artifact (`serverless-package`).
4. **Deploy**: dependiendo de la rama, se consume el artifact generado en el paso anterior para desplegar con `serverless deploy --package`.
   - `develop` → entorno **dev**.
   - `main` → entorno **prod**.

Todas las ejecuciones comparten el mismo mecanismo de cacheo de dependencias (usando `actions/setup-node` con `cache: npm`) para acelerar la instalación de módulos. El artefacto `serverless-package` se descarga en los jobs de despliegue y se reutiliza directamente, evitando reconstrucciones innecesarias.

## Reglas de protección de ramas

Las ramas de promoción `develop` y `main` requieren que se completen exitosamente los siguientes _status checks_ antes de permitir un merge:

- `CI Pipeline / Lint`
- `CI Pipeline / Test`
- `CI Pipeline / Build`

Estas comprobaciones garantizan que el código pase por todo el pipeline antes de ser promovido.
