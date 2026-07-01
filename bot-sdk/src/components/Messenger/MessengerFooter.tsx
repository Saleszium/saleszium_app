/**
 * MessengerFooter - Powered by Rhinon footer
 */
import React from 'react';

interface MessengerFooterProps {
  theme: 'light' | 'dark';
}

export const MessengerFooter: React.FC<MessengerFooterProps> = ({ theme }) => {
  const logoSrc = theme === 'dark'
            ? 'https://www.saleszium.com/assets/Saleszium_Light_Logo.png'
            : 'https://www.saleszium.com/assets/Saleszium_Dark_Logo.png';

  return (
    <div className='footer'>
      <p>Powered by</p>
      <img
        src={logoSrc}
        alt='Saleszium Logo'
        style={{ width: 50 }}
      />
    </div>
  );
};

export default MessengerFooter;
