-- Create vendor_registrations table
CREATE TABLE public.vendor_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vendor_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor registrations
CREATE POLICY "Anyone can submit vendor registration"
ON public.vendor_registrations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view their own registrations"
ON public.vendor_registrations
FOR SELECT
TO public
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendor_registrations_updated_at
BEFORE UPDATE ON public.vendor_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();