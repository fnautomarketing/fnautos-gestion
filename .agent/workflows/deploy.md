---
description: Build changes on current branch, commit and push, merge to master, push master, and return to original branch.
---
// turbo-all

1. Identificar la rama actual (`git branch --show-current`).
2. Ejecutar chequeo de calidad (ESLint & TypeScript):
   * `npx eslint src/ --ext .ts,.tsx`
   * `npx tsc --noEmit`
   * Si cualquiera de estos falla con errores, DETENER el despliegue.
3. Ejecutar build web: `npm run build`.
   * Si el comando falla, DETENER el despliegue.
4. Añadir cambios: `git add .`.
5. Hacer commit (el asistente preguntará por el mensaje o usará uno descriptivo): `git commit -m "deploy: [descripcion de los cambios]"`.
6. Subir rama de desarrollo: `git push origin [current-branch]`.
7. Cambiar a master: `git checkout master`.
8. Fusionar cambios: `git merge [current-branch]`.
9. Subir a master remoto (disparando Hostinger): `git push origin master`.
10. Volver a la rama de desarrollo: `git checkout [current-branch]`.
