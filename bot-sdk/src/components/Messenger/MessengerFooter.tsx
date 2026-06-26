/**
 * MessengerFooter - Powered by Rhinon footer
 */
import React from 'react';

interface MessengerFooterProps {
  theme: 'light' | 'dark';
}

export const MessengerFooter: React.FC<MessengerFooterProps> = ({ theme }) => {
  const logoSrc = theme === 'dark'
            ? 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/Rhinon_Tech_Light_Logo.png'
            : 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/Rhinon_Tech_Dark_Logo.png';

  return (
    <div className='footer'>
      <p>Powered by</p>
      <img
        src={logoSrc}
        alt='Rhinon Logo'
        style={{ width: 50 }}
      />
    </div>
  );
};

export default MessengerFooter;
