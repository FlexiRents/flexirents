import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface BookingRequest {
  id: string;
  requested_date: string;
  requested_time: string;
  service_type: string;
  status: string;
  requested_hours: number;
  created_at: string;
  provider_response: string | null;
  notes: string | null;
  user_id: string;
  service_provider_registrations: {
    provider_name: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("booking_requests")
          .select(`
            *,
            service_provider_registrations!booking_requests_provider_id_fkey(provider_name),
            profiles!booking_requests_user_id_fkey(full_name)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching booking requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Bookings Management</h2>
        <p className="text-muted-foreground mt-2">View all service bookings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Booking Requests ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.profiles?.full_name || "Unknown User"}
                    </TableCell>
                    <TableCell>
                      {booking.service_provider_registrations?.provider_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.service_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(new Date(booking.requested_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{booking.requested_time}</TableCell>
                    <TableCell>{booking.requested_hours} hours</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "approved" ? "default" :
                          booking.status === "pending" ? "secondary" :
                          "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(booking.created_at), "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
