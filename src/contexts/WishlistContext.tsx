import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface WishlistItem {
  id: number | string;
  type: "rental" | "sale" | "service";
  title: string;
  price?: string;
  rate?: string;
  location?: string;
  image?: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number | string) => void;
  isInWishlist: (id: number | string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem("flexirents-wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("flexirents-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (item: WishlistItem) => {
    setWishlist((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromWishlist = (id: number | string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  const isInWishlist = (id: number | string) => {
    return wishlist.some((item) => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
