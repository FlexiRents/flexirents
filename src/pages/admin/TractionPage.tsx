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
import { useRealtimeVisitors } from "@/hooks/useVisitorTracking";

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
  const { currentVisitors } = useRealtimeVisitors();

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
      
      // Fetch real page visits
      const { data: pageVisits, error: visitsError } = await supabase
        .from("page_visits")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (visitsError) throw visitsError;

      // Generate time series data from real visits
      const days: TimeSeriesData[] = [];
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = subDays(end, daysDiff - i);
        const dateStr = format(date, "yyyy-MM-dd");
        
        const dayVisits = pageVisits?.filter(v => 
          format(new Date(v.created_at), "yyyy-MM-dd") === dateStr
        ) || [];
        
        // Count unique sessions for visitors
        const uniqueSessions = new Set(dayVisits.map(v => v.session_id));
        
        days.push({
          date: format(date, "d MMM"),
          value: uniqueSessions.size,
        });
      }

      // Calculate metrics from real data
      const uniqueSessions = new Set(pageVisits?.map(v => v.session_id) || []);
      const totalVisitors = uniqueSessions.size;
      const totalPageviews = pageVisits?.length || 0;
      const viewsPerVisit = totalVisitors > 0 ? (totalPageviews / totalVisitors).toFixed(2) : "0";
      
      // Calculate average session duration (if we have ended_at timestamps)
      const sessionsWithDuration = pageVisits?.filter(v => v.ended_at) || [];
      let avgDuration = 0;
      if (sessionsWithDuration.length > 0) {
        const totalDuration = sessionsWithDuration.reduce((sum, v) => {
          const start = new Date(v.created_at).getTime();
          const end = new Date(v.ended_at!).getTime();
          return sum + (end - start) / 1000;
        }, 0);
        avgDuration = Math.floor(totalDuration / sessionsWithDuration.length);
      }

      // Calculate bounce rate (single page visits)
      const sessionPageCounts: Record<string, number> = {};
      pageVisits?.forEach(v => {
        sessionPageCounts[v.session_id] = (sessionPageCounts[v.session_id] || 0) + 1;
      });
      const singlePageSessions = Object.values(sessionPageCounts).filter(count => count === 1).length;
      const bounceRate = totalVisitors > 0 ? Math.floor((singlePageSessions / totalVisitors) * 100) : 0;

      // Generate list data from real visits
      const sourceCounts: Record<string, number> = {};
      const pageCounts: Record<string, number> = {};
      const deviceCounts: Record<string, number> = {};
      const countryCounts: Record<string, number> = {};

      pageVisits?.forEach(v => {
        const source = v.source || "direct";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        
        pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
        
        const device = v.device_type || "unknown";
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        
        const country = v.country || "Unknown";
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });

      const sources: ListData[] = Object.entries(sourceCounts)
        .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
        .sort((a, b) => b.value - a.value);

      const pages: ListData[] = Object.entries(pageCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const countries: ListData[] = Object.entries(countryCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const devices: ListData[] = Object.entries(deviceCounts)
        .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
        .sort((a, b) => b.value - a.value);

      // Generate pageviews time series
      const pageviewDays = [];
      for (let i = 0; i <= daysDiff; i++) {
        const date = subDays(end, daysDiff - i);
        const dateStr = format(date, "yyyy-MM-dd");
        
        const dayPageviews = pageVisits?.filter(v => 
          format(new Date(v.created_at), "yyyy-MM-dd") === dateStr
        ).length || 0;
        
        pageviewDays.push({
          date: format(date, "d MMM"),
          value: dayPageviews,
        });
      }

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
          pageviews: pageviewDays,
          viewsPerVisit: days.map((d, i) => ({ 
            ...d, 
            value: d.value > 0 ? parseFloat((pageviewDays[i].value / d.value).toFixed(2)) : 0 
          })),
          visitDuration: days.map(d => ({ ...d, value: d.value > 0 ? avgDuration : 0 })),
          bounceRate: days.map(d => ({ ...d, value: d.value > 0 ? bounceRate : 0 })),
        },
        lists: {
          sources,
          pages,
          countries,
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

  const renderBarList = (title: string, data: ListData[], showPercentage = false) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
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
            <span className={`w-2 h-2 rounded-full ${currentVisitors > 0 ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            {currentVisitors} current visitor{currentVisitors !== 1 ? "s" : ""}
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
        {renderBarList("Country", tractionData?.lists.countries || [])}
        {renderBarList("Device", tractionData?.lists.devices || [], true)}
      </div>
    </div>
  );
};

export default TractionPage;
