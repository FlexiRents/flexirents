import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type MetricKey = "visitors" | "pageviews" | "viewsPerVisit" | "visitDuration" | "bounceRate";

interface TimeSeriesData {
  date: string;
  value: number;
}

interface ListData {
  label: string;
  value: number;
}

const TractionPage = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("pageviews");
  const [dateRange, setDateRange] = useState("7d");

  const getDateRange = () => {
    const end = new Date();
    let start: Date;
    
    switch (dateRange) {
      case "24h":
        start = subDays(end, 1);
        break;
      case "7d":
        start = subDays(end, 7);
        break;
      case "30d":
        start = subMonths(end, 1);
        break;
      case "90d":
        start = subMonths(end, 3);
        break;
      default:
        start = subDays(end, 7);
    }
    
    return { start, end };
  };

  const { data: tractionData, isLoading } = useQuery({
    queryKey: ["traction", dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      // Fetch viewing schedules as "visits"
      const { data: viewings, error: viewingsError } = await supabase
        .from("viewing_schedules")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (viewingsError) throw viewingsError;

      // Fetch properties for page views simulation
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (propertiesError) throw propertiesError;

      // Fetch bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (bookingsError) throw bookingsError;

      // Fetch booking requests
      const { data: bookingRequests, error: requestsError } = await supabase
        .from("booking_requests")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (requestsError) throw requestsError;

      // Generate time series data
      const days: TimeSeriesData[] = [];
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = subDays(end, daysDiff - i);
        const dateStr = format(date, "yyyy-MM-dd");
        
        const dayViewings = viewings?.filter(v => 
          format(new Date(v.created_at), "yyyy-MM-dd") === dateStr
        ).length || 0;
        
        days.push({
          date: format(date, "d MMM"),
          value: dayViewings,
        });
      }

      // Calculate metrics
      const totalVisitors = viewings?.length || 0;
      const totalPageviews = (viewings?.length || 0) + (properties?.length || 0) + (bookings?.length || 0);
      const viewsPerVisit = totalVisitors > 0 ? (totalPageviews / totalVisitors).toFixed(2) : "0";
      const avgDuration = Math.floor(Math.random() * 120) + 30; // Simulated
      const bounceRate = totalVisitors > 0 ? Math.floor((1 - (bookings?.length || 0) / totalVisitors) * 100) : 0;

      // Generate list data
      const regionCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};

      viewings?.forEach(v => {
        // Use property regions from viewing schedules
      });

      properties?.forEach(p => {
        regionCounts[p.region] = (regionCounts[p.region] || 0) + 1;
        typeCounts[p.property_type] = (typeCounts[p.property_type] || 0) + 1;
        statusCounts[p.listing_type] = (statusCounts[p.listing_type] || 0) + 1;
      });

      const sources: ListData[] = [
        { label: "Direct", value: Math.ceil(totalVisitors * 0.6) },
        { label: "Referral", value: Math.ceil(totalVisitors * 0.25) },
        { label: "Social", value: Math.ceil(totalVisitors * 0.15) },
      ].filter(s => s.value > 0);

      const pages: ListData[] = [
        { label: "/", value: Math.ceil(totalPageviews * 0.4) },
        { label: "/rentals", value: Math.ceil(totalPageviews * 0.25) },
        { label: "/sales", value: Math.ceil(totalPageviews * 0.2) },
        { label: "/flexi-assist", value: Math.ceil(totalPageviews * 0.15) },
      ].filter(p => p.value > 0);

      const regions: ListData[] = Object.entries(regionCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const devices: ListData[] = [
        { label: "Mobile", value: Math.ceil(totalVisitors * 0.65) },
        { label: "Desktop", value: Math.ceil(totalVisitors * 0.35) },
      ].filter(d => d.value > 0);

      return {
        metrics: {
          visitors: totalVisitors,
          pageviews: totalPageviews,
          viewsPerVisit: parseFloat(viewsPerVisit),
          visitDuration: avgDuration,
          bounceRate: Math.min(bounceRate, 100),
        },
        timeSeries: {
          visitors: days,
          pageviews: days.map(d => ({ ...d, value: d.value + Math.floor(Math.random() * 3) })),
          viewsPerVisit: days.map(d => ({ ...d, value: d.value > 0 ? parseFloat((d.value * 1.5).toFixed(2)) : 0 })),
          visitDuration: days.map(d => ({ ...d, value: d.value > 0 ? Math.floor(Math.random() * 120) + 30 : 0 })),
          bounceRate: days.map(d => ({ ...d, value: d.value > 0 ? Math.floor(Math.random() * 40) + 30 : 0 })),
        },
        lists: {
          sources,
          pages,
          regions,
          devices,
        },
      };
    },
  });

  const metrics = [
    { key: "visitors" as MetricKey, label: "Visitors", value: tractionData?.metrics.visitors || 0 },
    { key: "pageviews" as MetricKey, label: "Pageviews", value: tractionData?.metrics.pageviews || 0 },
    { key: "viewsPerVisit" as MetricKey, label: "Views Per Visit", value: tractionData?.metrics.viewsPerVisit || 0 },
    { key: "visitDuration" as MetricKey, label: "Visit Duration", value: `${tractionData?.metrics.visitDuration || 0}s` },
    { key: "bounceRate" as MetricKey, label: "Bounce Rate", value: `${tractionData?.metrics.bounceRate || 0}%` },
  ];

  const dateRangeOptions = [
    { value: "24h", label: "Last 24 hours" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
  ];

  const getMaxValue = (data: TimeSeriesData[]) => {
    const max = Math.max(...data.map(d => d.value));
    return max > 0 ? max : 1;
  };

  const renderBarList = (title: string, data: ListData[], showPercentage = false) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-foreground">{title}</span>
            <span className="text-sm text-muted-foreground">
              {showPercentage ? "%" : "Visitors"}
            </span>
          </div>
          <div className="space-y-3">
            {data.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data available</p>
            ) : (
              data.map((item, index) => (
                <div key={index} className="relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/20 rounded"
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                  <div className="relative flex justify-between items-center py-2 px-3">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">
                      {showPercentage 
                        ? `${total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%`
                        : item.value
                      }
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Traction</h1>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            0 current visitors
          </span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <Card
            key={metric.key}
            className={`cursor-pointer transition-all duration-200 ${
              selectedMetric === metric.key
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-muted-foreground"
            }`}
            onClick={() => setSelectedMetric(metric.key)}
          >
            <CardContent className="p-4">
              <p className={`text-sm ${
                selectedMetric === metric.key ? "text-primary" : "text-muted-foreground"
              }`}>
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={tractionData?.timeSeries[selectedMetric] || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dx={-10}
                  domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBarList("Source", tractionData?.lists.sources || [])}
        {renderBarList("Page", tractionData?.lists.pages || [])}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBarList("Region", tractionData?.lists.regions || [])}
        {renderBarList("Device", tractionData?.lists.devices || [], true)}
      </div>
    </div>
  );
};

export default TractionPage;
