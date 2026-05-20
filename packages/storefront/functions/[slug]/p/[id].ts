interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ASSETS: {
    fetch: (request: Request | string | URL) => Promise<Response>;
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;
  const productId = params.id as string;

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  let title = 'Vizzo Storefront';
  let description = 'تصفح واشترِ المنتجات المفضلة لديك مباشرة عبر الواتساب.';
  let imageUrl = '';

  if (productId && supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${productId}&select=*`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (res.ok) {
        const data = (await res.json()) as any[];
        if (data && data.length > 0) {
          const product = data[0];
          const isTombstone = product.is_archived || !product.is_available;
          
          let priceStr = '';
          const price = product.is_discounted && product.discount_price !== null
            ? product.discount_price
            : product.base_price;
          
          priceStr = `${price.toLocaleString('ar-SD')} ج.س`;

          if (isTombstone) {
            title = `[نفد من المخزون] ${product.name}`;
            description = `هذا المنتج غير متوفر حالياً في المتجر. تصفح باقي منتجات المتجر للاستفسار.`;
          } else {
            title = `${product.name} — ${priceStr}`;
            description = product.notes
              ? product.notes.slice(0, 150)
              : `اطلب ${product.name} الآن من المتجر الإلكتروني. التوصيل متوفر والدفع عند الاستلام.`;
          }

          if (product.images && product.images.length > 0) {
            imageUrl = product.images[0];
          }
        }
      }
    } catch (err) {
      console.error('[SSR Function Error] Failed fetching product:', err);
    }
  }

  // Fetch the root index.html from assets
  let html = '';
  try {
    const assetsRes = await env.ASSETS.fetch(new URL('/', request.url));
    html = await assetsRes.text();
  } catch (err) {
    // Fallback simple HTML shell if assets fetch fails
    html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  }

  // Inject meta tags inside the head
  const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${request.url}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}
  `;

  // Replace default title or insert before </head>
  let finalHtml = html;
  if (finalHtml.includes('<title>')) {
    finalHtml = finalHtml.replace(/<title>.*?<\/title>/gi, '');
  }
  
  finalHtml = finalHtml.replace('</head>', `${metaTags}\n  </head>`);

  return new Response(finalHtml, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
};
