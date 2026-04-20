import { Product, Stream, User } from "./types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Aura Glow Serum",
    description: "Instant hydration and glass skin finish.",
    price: 45.00,
    image: "https://picsum.photos/seed/beauty1/400/400",
    sellerId: "u1",
    category: "Beauty"
  },
  {
    id: "p2",
    name: "Midnight Pulse Headphones",
    description: "Active noise cancelling with deep bass.",
    price: 299.00,
    image: "https://picsum.photos/seed/tech1/400/400",
    sellerId: "u2",
    category: "Electronics"
  }
];

export const MOCK_STREAMS: Stream[] = [
  {
    id: "s1",
    creatorId: "u1",
    creatorName: "Aria Thorne",
    creatorAvatar: "https://picsum.photos/seed/avatar1/100/100",
    title: "Skincare Secrets & Flash Sale! ✨",
    viewerCount: 1240,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-applying-makeup-in-front-of-a-mirror-4054-large.mp4",
    products: [MOCK_PRODUCTS[0]],
    isActive: true
  },
  {
    id: "s2",
    creatorId: "u2",
    creatorName: "TechSam",
    creatorAvatar: "https://picsum.photos/seed/avatar2/100/100",
    title: "Unboxing the Future of Audio 🎧",
    viewerCount: 850,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-wearing-headphones-listens-to-music-4050-large.mp4",
    products: [MOCK_PRODUCTS[1]],
    isActive: true
  }
];

export const MOCK_USER: User = {
  id: "curr-user",
  name: "Alex Rivera",
  email: "alex@example.com",
  avatar: "https://picsum.photos/seed/myavatar/100/100",
  bio: "Lover of tech and minimalist aesthetics.",
  interests: ["Technology", "Design", "Music"],
  purchaseHistory: ["p2"],
  isInfluencer: true
};
