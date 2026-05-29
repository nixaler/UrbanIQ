import React from 'react';
import { Card as CardType } from '../types';
import { getCardRarityColor, getCardRarityGlow, hasAbility } from '../utils/cardUtils';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  showAbility?: boolean;
  showImage?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  isSelected = false,
  isDisabled = false,
  showAbility = true,
  showImage = true,
  size = 'medium'
}) => {
  const sizeStyles = {
    small: { width: 120, height: 160, fontSize: 10, padding: 8 },
    medium: { width: 180, height: 240, fontSize: 12, padding: 12 },
    large: { width: 240, height: 320, fontSize: 14, padding: 16 }
  };

  const currentSize = sizeStyles[size];
  const rarityColor = getCardRarityColor(card.rarityId);
  const rarityGlow = getCardRarityGlow(card.rarityId);

  return (
    <div
      onClick={!isDisabled ? onClick : undefined}
      style={{
        ...currentSize,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: `3px solid ${rarityColor}`,
        borderRadius: 12,
        boxShadow: isSelected 
          ? `0 0 20px ${rarityGlow}, 0 8px 16px rgba(0,0,0,0.2)`
          : `0 4px 8px rgba(0,0,0,0.1)`,
        cursor: isDisabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        padding: currentSize.padding,
        position: 'relative',
        overflow: 'hidden',
        opacity: isDisabled ? 0.6 : 1,
        transform: isSelected ? 'translateY(-4px)' : 'translateY(0)'
      }}
    >
      {/* Rarity indicator */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: rarityColor
      }} />

      {/* Card image */}
      {showImage && card.image && (
        <div style={{
          width: '100%',
          height: size === 'small' ? 60 : size === 'medium' ? 100 : 140,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 12,
          background: 'rgba(0,0,0,0.05)'
        }}>
          <img
            src={card.image}
            alt={card.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Card name */}
      <h3 style={{
        fontSize: currentSize.fontSize * 1.2,
        fontWeight: 700,
        margin: '8px 0',
        color: '#1a1a1a',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.2
      }}>
        {card.name}
      </h3>

      {/* Power indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        margin: '8px 0'
      }}>
        <div style={{
          background: rarityColor,
          color: 'white',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: currentSize.fontSize,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          {card.power}
        </div>
        <div style={{
          fontSize: currentSize.fontSize * 0.9,
          color: '#666',
          textTransform: 'capitalize',
          fontFamily: 'Inter, sans-serif'
        }}>
          {card.rarity}
        </div>
      </div>

      {/* Ability section */}
      {showAbility && hasAbility(card) && card.ability && (
        <div style={{
          marginTop: 'auto',
          padding: '8px',
          background: 'rgba(0,96,169,0.1)',
          borderRadius: 8,
          border: '1px solid rgba(0,96,169,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4
          }}>
            <span style={{ fontSize: currentSize.fontSize * 1.2 }}>
              {card.ability.icon}
            </span>
            <span style={{
              fontSize: currentSize.fontSize,
              fontWeight: 600,
              color: '#0060A9',
              fontFamily: 'Inter, sans-serif'
            }}>
              {card.ability.name}
            </span>
          </div>
          <p style={{
            fontSize: currentSize.fontSize * 0.85,
            color: '#444',
            margin: 0,
            lineHeight: 1.3,
            fontFamily: 'Inter, sans-serif'
          }}>
            {card.ability.description}
          </p>
        </div>
      )}

      {/* Card type badge */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        fontSize: currentSize.fontSize * 0.8,
        color: '#999',
        textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif'
      }}>
        {card.cardType}
      </div>
    </div>
  );
};