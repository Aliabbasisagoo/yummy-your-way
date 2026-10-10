-- Fair retry scheduling so a blocked delivery cannot starve runnable work.
ALTER TABLE public.whatsapp_webhook_events
  ADD COLUMN attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN next_retry_at timestamptz;

CREATE INDEX whatsapp_webhook_events_retry_idx
  ON public.whatsapp_webhook_events (next_retry_at)
  WHERE processed_at IS NULL;