-- Durable inbox for every WhatsApp webhook delivery Meta sends us.
CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id text NOT NULL UNIQUE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text
);

CREATE INDEX whatsapp_webhook_events_pending_idx
  ON public.whatsapp_webhook_events (received_at)
  WHERE processed_at IS NULL;

-- Inbound customer messages, deduplicated by provider message id.
CREATE TABLE public.whatsapp_inbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL UNIQUE,
  from_number text NOT NULL,
  type text,
  body text,
  media_id text,
  media_mime_type text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL
);

-- Orders sent to the restaurant's WhatsApp, with delivery state.
CREATE TABLE public.whatsapp_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  customer_name text NOT NULL,
  customer_phone text,
  mode text NOT NULL,
  location_name text NOT NULL,
  items jsonb NOT NULL,
  subtotal integer NOT NULL,
  total integer NOT NULL,
  note text,
  receipt_text text NOT NULL,
  message_id text,
  provider_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz
);

CREATE INDEX whatsapp_orders_message_id_idx
  ON public.whatsapp_orders (message_id)
  WHERE message_id IS NOT NULL;

-- Delivery status callbacks, kept even when they arrive before the order row knows its message id.
CREATE TABLE public.whatsapp_message_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  status text NOT NULL,
  provider_timestamp timestamptz,
  errors jsonb,
  delivery_id text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (delivery_id, message_id, status)
);

CREATE INDEX whatsapp_message_statuses_message_id_idx
  ON public.whatsapp_message_statuses (message_id);

-- Operational tables: only the app's own server-side code may touch them.
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
GRANT ALL ON public.whatsapp_inbound_messages TO service_role;
GRANT ALL ON public.whatsapp_orders TO service_role;
GRANT ALL ON public.whatsapp_message_statuses TO service_role;

ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_inbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_statuses ENABLE ROW LEVEL SECURITY;