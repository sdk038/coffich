import { resolveProductImageUrl } from '../lib/coffeeImages';

export default function ProductImage({ product, alt, loading = 'lazy', className = '' }) {
  const imageUrl = resolveProductImageUrl(product);
  
  return (
    <img
      src={imageUrl}
      alt={alt || product?.title || 'Product image'}
      loading={loading}
      decoding="async"
      className={className}
      onError={(e) => {
        // Fallback to static image if the resolved URL fails
        e.target.src = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=640&q=74&auto=format&fit=crop';
      }}
    />
  );
}
