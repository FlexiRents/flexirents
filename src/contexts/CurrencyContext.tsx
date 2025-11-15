import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'GHS' | 'EUR' | 'GBP' | 'NGN';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceUSD: number) => number;
  formatPrice: (priceUSD: number) => string;
  getAllCurrencyPrices: (priceUSD: number) => Array<{ currency: Currency; formatted: string }>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates (approximate)
const EXCHANGE_RATES = {
  USD: 1,
  GHS: 12.5,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1580,
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferred-currency');
    return (saved as Currency) || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('preferred-currency', currency);
  }, [currency]);

  const convertPrice = (priceUSD: number): number => {
    return priceUSD * EXCHANGE_RATES[currency];
  };

  const currencySymbols: Record<Currency, string> = {
    USD: '$',
    GHS: '₵',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
  };

  const formatPrice = (priceUSD: number): string => {
    const convertedPrice = convertPrice(priceUSD);
    const symbol = currencySymbols[currency];
    return `${symbol}${convertedPrice.toLocaleString()}`;
  };

  const getAllCurrencyPrices = (priceUSD: number) => {
    return Object.keys(EXCHANGE_RATES).map((curr) => {
      const currencyKey = curr as Currency;
      const converted = priceUSD * EXCHANGE_RATES[currencyKey];
      return {
        currency: currencyKey,
        formatted: `${currencySymbols[currencyKey]}${converted.toLocaleString()}`,
      };
    });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice, getAllCurrencyPrices }}>
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
