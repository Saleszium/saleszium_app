// MessengerFooter - Footer component showing "Powered by Rhinon"
import React, { memo } from 'react';

interface MessengerFooterProps {
  effectiveTheme: 'light' | 'dark';
}

export const MessengerFooter: React.FC<MessengerFooterProps> = memo(({ effectiveTheme }) => {
  return (
    <div className='footer'>
      <p>Powered by</p>
      <img
        src={
          effectiveTheme === 'dark'
            ? 'https://www.saleszium.com/assets/Saleszium_Light_Logo_small.png'
            : 'https://www.saleszium.com/assets/Saleszium_Dark_Logo_small.png'
        }
        alt='Saleszium Logo'
        style={{ width: 50 }}
        loading='lazy'
      />
    </div>
  );
});

MessengerFooter.displayName = 'MessengerFooter';

export default MessengerFooter;
