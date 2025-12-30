import * as simpleIcons from 'simple-icons';

export function icon(
  name,
  { size = 24, color = 'currentColor', title = true, strokeWidth, strokeColor } = {}
) {
  const key = 'si' + name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  const si = simpleIcons[key];

  if (!si) {
    console.warn(`Иконка '${name}' не найдена в simple-icons`);
    return '';
  }

  // Если передан strokeWidth → рисуем как обводку
  if (strokeWidth) {
    return `
      <svg role="img" width="${size}" height="${size}"
           viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
           fill="none" stroke="${strokeColor || color}"
           stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        ${title ? `<title>${si.title}</title>` : ''}
        <path d="${si.path}" />
      </svg>
    `;
  }

  // Дефолт — заливаем цветом
  return `
    <svg role="img" width="${size}" height="${size}"
         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
         fill="${color}">
      ${title ? `<title>${si.title}</title>` : ''}
      <path d="${si.path}" />
    </svg>
  `;
}