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
            ? 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/Rhinon_Tech_Light_Logo.png'
            : 'https://saleszium-live-assets.s3.ap-south-1.amazonaws.com/platform-uploads/Rhinon_Tech_Dark_Logo.png'
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
