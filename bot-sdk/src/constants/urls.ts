// Static URLs and CDN paths

export const LOGOS = {
  primaryLight: 'https://www.saleszium.com/assets/Saleszium_Light_Logo_small.png',
  primaryDark: 'https://www.saleszium.com/assets/Saleszium_Dark_Logo_small.png',
  rhinonWhite: 'https://www.saleszium.com/assets/Saleszium_Light_Logo.png',
} as const;

export const AVATARS = {
  SUPPORT: 'https://www.saleszium.com/assets/support_avatar.png',
  BOT: 'https://www.saleszium.com/assets/bot.png',
  DEFAULT_USER: 'https://img.freepik.com/premium-photo/beautiful-woman-with-natural-makeup-women-with-clean-fresh-skin-dark-hear-blue-eyes_150254-452.jpg?semt=ais_hybrid&w=740',
} as const;

export const BACKGROUNDS = {
  default: 'https://rhinontech.s3.ap-south-1.amazonaws.com/new-rhinontech/attachments/Screenshot%202025-09-10%20141134-1758786082229.png',
} as const;

// QR Code API
export const QR_CODE_API = 'https://api.qrserver.com/v1/create-qr-code/';
export const getQRCodeUrl = (data: string, size: number = 256): string =>
  `${QR_CODE_API}?size=${size}x${size}&data=${encodeURIComponent(data)}`;

// WhatsApp
export const getWhatsAppLink = (phoneNumber: string): string =>
  `https://wa.me/${phoneNumber}`;

// IP Address API
export const IP_API_URL = 'https://api.ipify.org?format=json';
