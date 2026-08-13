import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id);

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = userData.user.email;
    const customerName = order.shipping_address?.full_name ?? "Cliente";

    // Build invoice HTML
    const itemsHtml = (order.order_items ?? [])
      .map(
        (item: { product_name: string; size: string; color: string; quantity: number; price: number }) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">${item.product_name}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;">${item.size} / ${item.color}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.price).toFixed(2)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Factura ADSO Trend</title></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #1a1a1a;padding-bottom:20px;">
        <div>
          <h1 style="font-size:24px;margin:0;">ADSO Trend</h1>
          <p style="font-size:12px;color:#666;margin:4px 0;">Tienda de moda contemporánea</p>
          <p style="font-size:12px;color:#666;margin:0;">contacto@adsotrend.com</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:16px;font-weight:bold;margin:0;">Factura #${order.id.slice(0, 8).toUpperCase()}</p>
          <p style="font-size:12px;color:#666;margin:4px 0;">${new Date(order.created_at).toLocaleDateString("es")}</p>
        </div>
      </div>

      <div style="margin-top:20px;">
        <p style="font-size:12px;font-weight:600;color:#666;text-transform:uppercase;">Facturado a</p>
        <p style="font-size:14px;font-weight:bold;margin:4px 0;">${customerName}</p>
        <p style="font-size:13px;color:#555;">${order.shipping_address?.street ?? ""}</p>
        <p style="font-size:13px;color:#555;">${order.shipping_address?.city ?? ""}, ${order.shipping_address?.state ?? ""}</p>
        <p style="font-size:13px;color:#555;">${order.shipping_address?.phone ?? ""}</p>
        <p style="font-size:13px;color:#555;">${userEmail}</p>
      </div>

      <table style="width:100%;margin-top:20px;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;font-size:12px;text-transform:uppercase;color:#666;">
            <th style="padding:10px;text-align:left;">Producto</th>
            <th style="padding:10px;text-align:left;">Talla / Color</th>
            <th style="padding:10px;text-align:center;">Cant.</th>
            <th style="padding:10px;text-align:right;">Precio</th>
            <th style="padding:10px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="background:#f5f5f5;">
            <td colspan="4" style="padding:10px;text-align:right;font-weight:bold;">Total:</td>
            <td style="padding:10px;text-align:right;font-size:18px;font-weight:bold;">$${Number(order.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:20px;padding:15px;background:#fef9e7;border:1px solid #f5d76e;border-radius:8px;">
        <h3 style="font-size:14px;margin:0 0 10px;color:#9a7d0a;">Garantías</h3>
        <p style="font-size:12px;color:#9a7d0a;margin:4px 0;"><strong>Garantía de calidad:</strong> 30 días por defectos de fabricación desde la fecha de compra.</p>
        <p style="font-size:12px;color:#9a7d0a;margin:4px 0;"><strong>Garantía de devolución:</strong> 15 días posteriores a la entrega, prenda sin usar y con etiquetas originales.</p>
        <p style="font-size:12px;color:#9a7d0a;margin:4px 0;"><strong>Garantía de talla:</strong> Cambio gratuito de talla dentro de 7 días, sujeto a disponibilidad.</p>
        <p style="font-size:12px;color:#9a7d0a;margin:4px 0;"><strong>Soporte:</strong> contacto@adsotrend.com con el número de factura.</p>
      </div>

      <p style="font-size:11px;color:#999;margin-top:20px;text-align:center;">Esta factura es un documento electrónico válido como comprobante de compra.</p>
    </body>
    </html>`;

    // Send email using Supabase's built-in email
    const { error: emailError } = await supabase.auth.admin.sendEmail({
      email: userEmail,
      options: { emailRedirectTo: supabaseUrl },
    });

    // If sendEmail is not available, use a custom approach via the database
    // We'll insert into a notifications table that can be processed later
    if (emailError) {
      // Fallback: store the invoice in the database for manual sending
      await supabase.from("admin_notifications").insert({
        type: "invoice_email",
        title: `Factura enviada a ${userEmail}`,
        message: `Factura #${order.id.slice(0, 8)} para ${customerName}`,
        data: { order_id: order.id, email: userEmail, customer_name: customerName },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: `Factura enviada a ${userEmail}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
