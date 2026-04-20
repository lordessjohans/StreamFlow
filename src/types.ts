export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  sellerId: string;
  category: string;
}

export interface Stream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  viewerCount: number;
  videoUrl: string;
  products: Product[];
  isActive: boolean;
  pricePerView?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  interests: string[];
  purchaseHistory: string[];
  isInfluencer: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  isActive: boolean;
}

export interface Question {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isAnswered: boolean;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt?: any;
}
