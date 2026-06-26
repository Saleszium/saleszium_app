// Static URLs and CDN paths

export const LOGOS = {
  primaryLight: 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/Logo_Rhinon_Tech_light.png',
  primaryDark: 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/Logo_Rhinon_Tech.png',
  rhinonWhite: 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/Rhinon_Tech_Light_Logo.png',
} as const;

export const AVATARS = {
  SUPPORT: 'https://www.saleszium.com/assets/support_avatar.png',
  BOT: 'https://www.saleszium.com/assets/bot.png',
  DEFAULT_USER: 'https://img.freepik.com/premium-photo/beautiful-woman-with-natural-makeup-women-with-clean-fresh-skin-dark-hear-blue-eyes_150254-452.jpg?semt=ais_hybrid&w=740',
} as const;

export const BACKGROUNDS = {
  default: 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/q3lzdr4u88731.jpg',
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
