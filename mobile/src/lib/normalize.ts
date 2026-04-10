export function normalizeProduct(product: any) {
  if (!product) return product;
  return {
    ...product,
    documentId: product.documentId ?? product.document_id ?? product.id,
    shortDescription: product.shortDescription ?? product.short_description ?? '',
    description: product.description ?? '',
    price: Number(product.price) || 0,
  };
}

export function normalizeShop(shop: any) {
  if (!shop) return shop;
  return {
    ...shop,
    shopName: shop.shopName ?? shop.shop_name ?? 'Coffich',
    coverImage: shop.coverImage ?? shop.cover_image ?? null,
  };
}

export function normalizeHeroSlide(slide: any) {
  if (!slide) return slide;
  return {
    ...slide,
    buttonText: slide.buttonText ?? slide.button_text ?? '',
    buttonLink: slide.buttonLink ?? slide.button_link ?? '',
  };
}

export function normalizeUser(user: any) {
  if (!user) return user;
  return {
    ...user,
    firstName: user.firstName ?? user.first_name ?? '',
    lastName: user.lastName ?? user.last_name ?? '',
  };
}

export function normalizeOrder(order: any) {
  if (!order) return order;
  return {
    ...order,
    createdAt: order.createdAt ?? order.created_at ?? null,
    updatedAt: order.updatedAt ?? order.updated_at ?? null,
    totalSum: Number(order.totalSum ?? order.total_sum ?? 0),
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          ...item,
          lineSum: Number(item.lineSum ?? item.line_sum ?? 0),
          productKey: item.productKey ?? item.product_key ?? '',
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 0),
        }))
      : [],
  };
}
