-- Create service_provider_registrations table
CREATE TABLE public.service_provider_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  hourly_rate TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  certifications TEXT,
  availability TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_provider_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit service provider registration" 
ON public.service_provider_registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own registrations" 
ON public.service_provider_registrations 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_service_provider_registrations_updated_at
BEFORE UPDATE ON public.service_provider_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();