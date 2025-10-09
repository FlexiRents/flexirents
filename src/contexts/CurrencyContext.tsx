import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'GHS';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceUSD: number) => number;
  formatPrice: (priceUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rate: 1 USD = 12.5 GHS (approximate)
const USD_TO_GHS_RATE = 12.5;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferred-currency');
    return (saved as Currency) || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('preferred-currency', currency);
  }, [currency]);

  const convertPrice = (priceUSD: number): number => {
    if (currency === 'GHS') {
      return priceUSD * USD_TO_GHS_RATE;
    }
    return priceUSD;
  };

  const formatPrice = (priceUSD: number): string => {
    const convertedPrice = convertPrice(priceUSD);
    const symbol = currency === 'USD' ? '$' : '₵';
    return `${symbol}${convertedPrice.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
