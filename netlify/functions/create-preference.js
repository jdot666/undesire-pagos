// Esta función corre en el servidor de Netlify (nunca en el navegador),
// por eso aquí SÍ es seguro usar el Access Token secreto de Mercado Pago.

// IMPORTANTE: reemplaza esto por tu dominio real una vez lo tengas activo.
const SITE_URL = 'https://undesire1.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
  'Cache-Control': 'no-store'
};

exports.handler = async (event) => {
  // El navegador manda esta petición "de prueba" antes del POST real; hay que responderla OK.
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { items } = JSON.parse(event.body);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Carrito vacío' }) };
    }

    const preference = {
      items: items.map(i => ({
        title: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        currency_id: 'CLP'
      })),
      back_urls: {
        success: `${SITE_URL}/?pago=exitoso`,
        failure: `${SITE_URL}/?pago=fallido`,
        pending: `${SITE_URL}/?pago=pendiente`
      },
      auto_return: 'approved'
    };

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('Error de Mercado Pago:', data);
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'No se pudo crear el pago' }) };
    }

    // init_point = link real de checkout de Mercado Pago con todo el carrito cargado
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ init_point: data.init_point })
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: e.message }) };
  }
};
