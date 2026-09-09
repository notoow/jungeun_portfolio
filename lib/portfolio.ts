export const BASE = '/jungeun_portfolio/';
export const assetPath = (path: string) => `${BASE}${path.replace(/^\//, '')}`;
export type PortfolioImage = {
  src: string;
  width: number;
  height: number;
  mini?: string;
  animated?: boolean;
  poster?: string;
};
export type Project = {
  id: string;
  title: string;
  url: string;
  order: number;
  year: string;
  description: string;
  category: string;
  cover: PortfolioImage;
  images: PortfolioImage[];
  embeds: string[];
  text: string[];
};
export const categories = [
  { id: 'All', label: '전체' },
  { id: 'Brand & Graphic', label: '브랜딩·그래픽' },
  { id: 'Digital', label: '디지털' },
  { id: 'Illustration', label: '일러스트' },
  { id: 'Game', label: '게임' },
  { id: 'Social', label: '소셜' },
];
