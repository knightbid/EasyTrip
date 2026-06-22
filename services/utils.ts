export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

const seedToHue = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

export const getRandomImage = (width: number, height: number, seed: string): string => {
  const hue = seedToHue(seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue},55%,65%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360},55%,45%)"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="28" font-family="Arial,sans-serif" font-weight="bold">${seed}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#94a3b8" font-size="20" font-family="Arial,sans-serif">No Image</text></svg>'
)}`;

export const encodeData = (data: any): string => {
  try {
    // Encode URI component to handle Unicode (Vietnamese), then convert to Base64
    return btoa(encodeURIComponent(JSON.stringify(data)).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      }));
  } catch (e) {
    console.error("Failed to encode data", e);
    return "";
  }
};

export const decodeData = (str: string): any => {
  try {
    // Decode Base64 then URI component to get back Unicode string
    return JSON.parse(decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
  } catch (e) {
    console.error("Failed to decode data", e);
    return null;
  }
};