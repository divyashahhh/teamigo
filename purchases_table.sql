-- Create purchases table for recording merch purchases
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    merch_id UUID NOT NULL REFERENCES public.merchandise(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    merch_title TEXT NOT NULL,
    merch_price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    payment_status TEXT DEFAULT 'completed',
    payment_method TEXT DEFAULT 'simulated'
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_merch_id ON public.purchases(merch_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Hosts can view purchases of their merchandise
CREATE POLICY "Hosts can view purchases of their merchandise" ON public.purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.merchandise 
            WHERE merchandise.id = purchases.merch_id 
            AND merchandise.host_id = auth.uid()
        )
    );

-- Optional: Function to get purchase statistics for hosts
CREATE OR REPLACE FUNCTION get_purchase_stats(host_uuid UUID)
RETURNS TABLE (
    total_purchases BIGINT,
    total_revenue NUMERIC,
    unique_buyers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_purchases,
        COALESCE(SUM(p.merch_price * p.quantity), 0) as total_revenue,
        COUNT(DISTINCT p.user_id) as unique_buyers
    FROM public.purchases p
    JOIN public.merchandise m ON p.merch_id = m.id
    WHERE m.host_id = host_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.purchases TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_stats(UUID) TO authenticated; 