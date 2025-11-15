import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Home, Calendar, DollarSign, Download, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
  users: number;
  properties: number;
}

interface CategoryData {
  name: string;
  value: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    activeProperties: 0,
    completedBookings: 0,
    activeUsers: 0,
    growthRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryData[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const revenueChartRef = useRef<HTMLDivElement>(null);
  const bookingsChartRef = useRef<HTMLDivElement>(null);
  const growthChartRef = useRef<HTMLDivElement>(null);
  const distributionChartRef = useRef<HTMLDivElement>(null);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch overall stats
        const [
          { count: usersCount },
          { count: propertiesCount },
          { count: completedBookingsCount },
          { data: allBookings },
          { data: allUsers },
          { data: allProperties },
          { data: serviceProviders },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "available"),
          supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("bookings").select("created_at, status, total_hours"),
          supabase.from("profiles").select("created_at"),
          supabase.from("properties").select("created_at, property_type"),
          supabase.from("service_provider_registrations").select("service_category").eq("status", "approved"),
        ]);

        // Calculate monthly trends for the last 6 months
        const months: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthStart = startOfMonth(date);
          const monthEnd = endOfMonth(date);
          
          const monthBookings = allBookings?.filter(b => {
            const bookingDate = new Date(b.created_at);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
          }) || [];

          const monthUsers = allUsers?.filter(u => {
            const userDate = new Date(u.created_at);
            return userDate >= monthStart && userDate <= monthEnd;
          }) || [];

          const monthProperties = allProperties?.filter(p => {
            const propDate = new Date(p.created_at);
            return propDate >= monthStart && propDate <= monthEnd;
          }) || [];

          months.push({
            month: format(date, 'MMM yyyy'),
            revenue: monthBookings.reduce((sum, b) => sum + (b.total_hours * 50), 0),
            bookings: monthBookings.length,
            users: monthUsers.length,
            properties: monthProperties.length,
          });
        }
        setMonthlyData(months);

        // Service categories distribution
        const categoryMap = new Map<string, number>();
        serviceProviders?.forEach(sp => {
          categoryMap.set(sp.service_category, (categoryMap.get(sp.service_category) || 0) + 1);
        });
        setServiceCategories(
          Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
        );

        // Property types distribution
        const typeMap = new Map<string, number>();
        allProperties?.forEach(prop => {
          typeMap.set(prop.property_type, (typeMap.get(prop.property_type) || 0) + 1);
        });
        setPropertyTypes(
          Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }))
        );

        setAnalytics({
          totalRevenue: (completedBookingsCount || 0) * 150,
          activeProperties: propertiesCount || 0,
          completedBookings: completedBookingsCount || 0,
          activeUsers: usersCount || 0,
          growthRate: 12.5,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const exportToCSV = () => {
    try {
      // Create CSV content
      let csvContent = "Analytics Report\n\n";
      
      // Summary stats
      csvContent += "Summary Statistics\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Revenue,$${analytics.totalRevenue.toLocaleString()}\n`;
      csvContent += `Active Properties,${analytics.activeProperties}\n`;
      csvContent += `Completed Bookings,${analytics.completedBookings}\n`;
      csvContent += `Active Users,${analytics.activeUsers}\n`;
      csvContent += `Growth Rate,${analytics.growthRate}%\n\n`;

      // Monthly data
      csvContent += "Monthly Trends\n";
      csvContent += "Month,Revenue ($),Bookings,New Users,New Properties\n";
      monthlyData.forEach(row => {
        csvContent += `${row.month},${row.revenue},${row.bookings},${row.users},${row.properties}\n`;
      });
      csvContent += "\n";

      // Service categories
      csvContent += "Service Categories Distribution\n";
      csvContent += "Category,Count\n";
      serviceCategories.forEach(cat => {
        csvContent += `${cat.name},${cat.value}\n`;
      });
      csvContent += "\n";

      // Property types
      csvContent += "Property Types Distribution\n";
      csvContent += "Type,Count\n";
      propertyTypes.forEach(type => {
        csvContent += `${type.name},${type.value}\n`;
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `analytics-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "CSV report has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV report",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(33, 37, 41);
      pdf.text("Analytics Report", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(108, 117, 125);
      pdf.text(`Generated on ${format(new Date(), "MMMM dd, yyyy")}`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 15;

      // Summary stats table
      pdf.setFontSize(14);
      pdf.setTextColor(33, 37, 41);
      pdf.text("Summary Statistics", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: [
          ["Total Revenue", `$${analytics.totalRevenue.toLocaleString()}`],
          ["Active Properties", analytics.activeProperties.toString()],
          ["Completed Bookings", analytics.completedBookings.toString()],
          ["Active Users", analytics.activeUsers.toString()],
          ["Growth Rate", `${analytics.growthRate}%`],
        ],
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Monthly trends table
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text("Monthly Trends", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Month", "Revenue ($)", "Bookings", "New Users", "New Properties"]],
        body: monthlyData.map(row => [
          row.month,
          row.revenue.toString(),
          row.bookings.toString(),
          row.users.toString(),
          row.properties.toString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Capture and add charts
      const captureChart = async (ref: React.RefObject<HTMLDivElement>, title: string) => {
        if (!ref.current) return;
        
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          backgroundColor: "#ffffff",
        });
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight + 10 > 280) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text(title, 14, yPosition);
        yPosition += 5;
        
        pdf.addImage(imgData, "PNG", 14, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      };

      // Add charts to PDF
      if (revenueChartRef.current) {
        await captureChart(revenueChartRef, "Revenue Trends");
      }
      
      if (bookingsChartRef.current) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        await captureChart(bookingsChartRef, "Booking Patterns");
      }

      if (growthChartRef.current) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        await captureChart(growthChartRef, "User & Property Growth");
      }

      // Distribution data
      pdf.addPage();
      yPosition = 20;

      pdf.setFontSize(14);
      pdf.text("Service Categories Distribution", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Category", "Count"]],
        body: serviceCategories.map(cat => [cat.name, cat.value.toString()]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      pdf.text("Property Types Distribution", 14, yPosition);
      yPosition += 5;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Type", "Count"]],
        body: propertyTypes.map(type => [type.name, type.value.toString()]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Save PDF
      pdf.save(`analytics-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast({
        title: "Export Successful",
        description: "PDF report has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Properties",
      value: analytics.activeProperties,
      icon: Home,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed Bookings",
      value: analytics.completedBookings,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "Active Users",
      value: analytics.activeUsers,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Growth Rate",
      value: `+${analytics.growthRate}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-2">Track platform performance and insights</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={loading || exporting} className="gap-2">
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export Report"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportToCSV} className="gap-2">
              <FileText className="h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="bookings">Booking Patterns</TabsTrigger>
          <TabsTrigger value="growth">User Growth</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Revenue Trends */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent ref={revenueChartRef}>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)"
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Patterns */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Booking Patterns
              </CardTitle>
            </CardHeader>
            <CardContent ref={bookingsChartRef}>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" name="Total Bookings" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Growth */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                User & Property Growth
              </CardTitle>
            </CardHeader>
            <CardContent ref={growthChartRef}>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="New Users"
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="properties" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      name="New Properties"
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={distributionChartRef}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Service Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={serviceCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Property Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={propertyTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {propertyTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
