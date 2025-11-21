export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const getRandomImage = (width: number, height: number, seed: string): string => {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

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