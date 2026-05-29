import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const sizeStyles = {
    small: { width: 20, height: 20, fontSize: 12 },
    medium: { width: 40, height: 40, fontSize: 16 },
    large: { width: 60, height: 60, fontSize: 20 }
  };

  const currentSize = sizeStyles[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 16
    }}>
      <div
        style={{
          width: currentSize.width,
          height: currentSize.height,
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #0060A9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <p style={{
        fontSize: currentSize.fontSize,
        color: '#333',
        fontFamily: 'Inter, sans-serif',
        margin: 0
      }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};