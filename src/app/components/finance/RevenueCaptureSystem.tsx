import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Percent,
  AlertTriangle,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { BackButton } from "../ui/back-button";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { CITIES } from "../../contexts/CityContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  REVENUE_DATA_MARCH_2026,
  getRevenueByPackage,
  getRevenueByWasher,
  getRevenueByPaymentMode,
  getRevenueSummary,
} from "../../data/revenueData";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// KPI Card Component
function KPICard({ title, value, change, trend, icon: Icon }: any) {
  const isPositive = change > 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{value}</h3>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500">vs {trend}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenueCaptureSystem() {
  const allEmps = employeeDatabaseService.getAll();
  const { currentRole } = useRole();
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const [comparison, setComparison] = useState("Week vs Last Week");
  const [filterCity, setFilterCity] = useState("All");
  const [filterZone, setFilterZone] = useState("All");
  const [filterPincode, setFilterPincode] = useState("All");
  const [filterSupervisor, setFilterSupervisor] = useState("All");
  const [filterRevenueType, setFilterRevenueType] = useState("All");
  const [chartToggle, setChartToggle] = useState("Total");

  // Check access
  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin" || currentRole === "Accounts";

  // Filter data based on selections
  const filteredRevenueData = useMemo(() => {
    return REVENUE_DATA_MARCH_2026.filter(entry => {
      if (filterPincode !== "All" && entry.pinCode !== filterPincode) return false;
      if (filterRevenueType !== "All" && !entry.packageType.toLowerCase().includes(filterRevenueType.toLowerCase())) return false;
      return true;
    });
  }, [filterPincode, filterRevenueType]);

  // Calculate metrics from actual data
  const metrics = useMemo(() => {
    const summary = getRevenueSummary();
    const totalRevenue = filteredRevenueData.reduce((sum, r) => sum + r.totalAmount, 0);
    const subscriptionRevenue = filteredRevenueData
      .filter(r => r.subscriptionType !== "One-time")
      .reduce((sum, r) => sum + r.totalAmount, 0);

    // Get unique customers
    const uniqueCustomers = new Set(filteredRevenueData.map(r => r.customerId));
    const repeatCustomers = filteredRevenueData.filter(r => {
      const customerOrders = filteredRevenueData.filter(e => e.customerId === r.customerId);
      return customerOrders.length > 1;
    });
    const uniqueRepeatCustomers = new Set(repeatCustomers.map(r => r.customerId));
    const repeatRevenue = repeatCustomers.reduce((sum, r) => sum + r.totalAmount, 0);

    const avgTicket = totalRevenue / filteredRevenueData.length;
    const retentionRate = (uniqueRepeatCustomers.size / uniqueCustomers.size) * 100;

    // Estimate refunds (assume 2.8% of total)
    const refundPercent = 2.8;
    const lostRevenue = totalRevenue * 0.028;

    // New customers (customers with only 1 order)
    const newCustomers = Array.from(uniqueCustomers).filter(custId => {
      return filteredRevenueData.filter(r => r.customerId === custId).length === 1;
    }).length;

    return {
      totalRevenue,
      subscriptionRevenue,
      repeatRevenue,
      retentionRate,
      avgTicket,
      refundPercent,
      lostRevenue,
      newCustomers,
      uniqueRepeatCustomers: uniqueRepeatCustomers.size,
    };
  }, [filteredRevenueData]);

  // Calculate KPI data dynamically
  const kpiData = [
    {
      title: "Total Revenue",
      value: `₹${Math.round(metrics.totalRevenue).toLocaleString('en-IN')}`,
      change: 12.5,
      trend: "last week",
      icon: DollarSign
    },
    {
      title: "Subscription Revenue",
      value: `₹${Math.round(metrics.subscriptionRevenue).toLocaleString('en-IN')}`,
      change: 8.3,
      trend: "last week",
      icon: RefreshCcw
    },
    {
      title: "Repeat Revenue",
      value: `₹${Math.round(metrics.repeatRevenue).toLocaleString('en-IN')}`,
      change: 15.2,
      trend: "last week",
      icon: TrendingUp
    },
    {
      title: "Retention Rate",
      value: `${metrics.retentionRate.toFixed(1)}%`,
      change: 5.1,
      trend: "last month",
      icon: Percent
    },
    {
      title: "Avg Ticket Size",
      value: `₹${Math.round(metrics.avgTicket).toLocaleString('en-IN')}`,
      change: -2.3,
      trend: "last week",
      icon: DollarSign
    },
    {
      title: "Refund %",
      value: `${metrics.refundPercent.toFixed(1)}%`,
      change: -0.5,
      trend: "last month",
      icon: AlertTriangle
    },
    {
      title: "Lost Revenue",
      value: `₹${Math.round(metrics.lostRevenue).toLocaleString('en-IN')}`,
      change: -12.0,
      trend: "last week",
      icon: TrendingDown
    },
    {
      title: "New Customers",
      value: metrics.newCustomers.toString(),
      change: 18.5,
      trend: "last week",
      icon: UserPlus
    },
  ];

  // Calculate trend data by date
  const revenueTrendData = useMemo(() => {
    const dailyData: Record<string, { total: number; subscription: number; onetime: number }> = {};

    filteredRevenueData.forEach(entry => {
      const date = new Date(entry.washDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, subscription: 0, onetime: 0 };
      }
      dailyData[date].total += entry.totalAmount;
      if (entry.subscriptionType !== "One-time") {
        dailyData[date].subscription += entry.totalAmount;
      } else {
        dailyData[date].onetime += entry.totalAmount;
      }
    });

    return Object.entries(dailyData)
      .map(([date, data], index) => ({
        id: `trend-${index}`,
        date,
        ...data
      }))
      .slice(-7); // Last 7 days
  }, [filteredRevenueData]);

  // Revenue split by package type
  const revenueSplitData = useMemo(() => {
    const packageData = getRevenueByPackage();
    return Object.entries(packageData)
      .map(([name, data], index) => ({
        id: `split-${name}-${index}`,
        name,
        value: data.revenue,
        color: COLORS[index % COLORS.length]
      }))
      .filter(item => item.value > 0);
  }, []);

  // Refund vs Revenue by month
  const refundVsRevenueData = useMemo(() => {
    const monthlyData: Record<string, { revenue: number; refund: number }> = {};

    filteredRevenueData.forEach(entry => {
      const month = new Date(entry.washDate).toLocaleDateString('en-IN', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, refund: 0 };
      }
      monthlyData[month].revenue += entry.totalAmount;
      monthlyData[month].refund += entry.totalAmount * 0.028; // 2.8% refund rate
    });

    return Object.entries(monthlyData).map(([month, data], index) => ({
      id: `refund-${month}-${index}`,
      month,
      ...data
    }));
  }, [filteredRevenueData]);

  // Location performance
  const locationPerformanceData = useMemo(() => {
    const locationData: Record<string, { revenue: number; orders: number; refunds: number }> = {};

    filteredRevenueData.forEach(entry => {
      // Use pincode as location for now
      const location = entry.pinCode;
      if (!locationData[location]) {
        locationData[location] = { revenue: 0, orders: 0, refunds: 0 };
      }
      locationData[location].revenue += entry.totalAmount;
      locationData[location].orders += 1;
      locationData[location].refunds += entry.totalAmount * 0.028;
    });

    return Object.entries(locationData)
      .map(([location, data]) => ({
        location,
        revenue: data.revenue,
        orders: data.orders,
        avgTicket: Math.round(data.revenue / data.orders),
        refundPercent: parseFloat(((data.refunds / data.revenue) * 100).toFixed(1))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredRevenueData]);

  // Supervisor performance
  const supervisorPerformanceData = useMemo(() => {
    const washerData = getRevenueByWasher();

    return Object.entries(washerData)
      .map(([washerId, data]) => ({
        supervisor: data.name,
        revenue: data.revenue,
        orders: data.count,
        avgTicket: Math.round(data.revenue / data.count),
        missedServices: Math.floor(Math.random() * 8), // Mock for now
        refundPercent: parseFloat(((data.revenue * 0.028) / data.revenue * 100).toFixed(1))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, []);

  if (!hasAccess) {
    return (
      <div className="p-6">
        <BackButton to="/finance" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access the Revenue Dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance" />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive revenue analytics and performance tracking
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Yesterday">Yesterday</SelectItem>
              <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
              <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="Last Month">Last Month</SelectItem>
              <SelectItem value="Custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={comparison} onValueChange={setComparison}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today vs Yesterday">Today vs Yesterday</SelectItem>
              <SelectItem value="Week vs Last Week">Week vs Last Week</SelectItem>
              <SelectItem value="Month vs Last Month">Month vs Last Month</SelectItem>
              <SelectItem value="Custom">Custom Comparison</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Cities</SelectItem>
                {Object.values(CITIES).map(c=>(<SelectItem key={c.id} value={c.name}>{c.displayName}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterZone} onValueChange={setFilterZone}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Zones</SelectItem>
                <SelectItem value="North">North Zone</SelectItem>
                <SelectItem value="South">South Zone</SelectItem>
                <SelectItem value="East">East Zone</SelectItem>
                <SelectItem value="West">West Zone</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPincode} onValueChange={setFilterPincode}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pincode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Pincodes</SelectItem>
                <SelectItem value="395005">395005</SelectItem>
                <SelectItem value="395006">395006</SelectItem>
                <SelectItem value="395007">395007</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSupervisor} onValueChange={setFilterSupervisor}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Supervisors</SelectItem>
                {allEmps.filter(e=>e.role==="TSE").map(e=>(
                  <SelectItem key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRevenueType} onValueChange={setFilterRevenueType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Revenue Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Subscription">Subscription</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI CARDS - 8 CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* MAIN REVENUE TREND CHART */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={chartToggle === "Total" ? "default" : "outline"}
                onClick={() => setChartToggle("Total")}
              >
                Total
              </Button>
              <Button
                size="sm"
                variant={chartToggle === "Subscription" ? "default" : "outline"}
                onClick={() => setChartToggle("Subscription")}
              >
                Subscription
              </Button>
              <Button
                size="sm"
                variant={chartToggle === "One-time" ? "default" : "outline"}
                onClick={() => setChartToggle("One-time")}
              >
                One-time
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300} key={`chart-container-${chartToggle}`}>
            <LineChart data={revenueTrendData} key={`linechart-${chartToggle}`}>
              <CartesianGrid key={`grid-${chartToggle}`} strokeDasharray="3 3" />
              <XAxis key={`xaxis-${chartToggle}`} dataKey="date" />
              <YAxis key={`yaxis-${chartToggle}`} />
              <RechartsTooltip key={`tooltip-${chartToggle}`} />
              <Legend key={`legend-${chartToggle}`} />
              {chartToggle === "Total" && <Line key={`line-${chartToggle}`} type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Revenue" />}
              {chartToggle === "Subscription" && <Line key={`line-${chartToggle}`} type="monotone" dataKey="subscription" stroke="#10b981" strokeWidth={2} name="Subscription" />}
              {chartToggle === "One-time" && <Line key={`line-${chartToggle}`} type="monotone" dataKey="onetime" stroke="#f59e0b" strokeWidth={2} name="One-time" />}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SECONDARY CHARTS - 2 SIDE BY SIDE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Revenue Split - Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Split</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart key="piechart-revenue">
                <Pie
                  key="pie-revenue-split"
                  data={revenueSplitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {revenueSplitData.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip key="tooltip-revenue-split" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Refund vs Revenue - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Refund vs Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={refundVsRevenueData} key="barchart-refund">
                <CartesianGrid key="grid-refund" strokeDasharray="3 3" />
                <XAxis key="xaxis-refund" dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis key="yaxis-refund" tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip key="tooltip-refund" />
                <Legend key="legend-refund" />
                <Bar key="bar-revenue" dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar key="bar-refund" dataKey="refund" fill="#ef4444" name="Refund" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* LOCATION PERFORMANCE TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Location Performance (Top 5 by Pincode)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Avg Ticket</TableHead>
                <TableHead className="text-right">Refund %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locationPerformanceData.map((row, index) => (
                <TableRow key={index} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">PIN {row.location}</TableCell>
                  <TableCell className="text-right">₹{row.revenue.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">{row.orders}</TableCell>
                  <TableCell className="text-right">₹{row.avgTicket.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.refundPercent < 3 ? "default" : "destructive"}>
                      {row.refundPercent}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CUSTOMER INSIGHTS - 2 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Repeat Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Repeat Customers</p>
                <h3 className="text-3xl font-bold text-gray-900">{metrics.uniqueRepeatCustomers}</h3>
              </div>
              <div>
                <p className="text-sm text-gray-500">Repeat Revenue Contribution</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-blue-600">
                    {((metrics.repeatRevenue / metrics.totalRevenue) * 100).toFixed(1)}%
                  </h3>
                  <span className="text-sm text-gray-500">of total revenue</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12.3% vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Renewal Rate</p>
                <h3 className="text-3xl font-bold text-gray-900">{metrics.retentionRate.toFixed(1)}%</h3>
              </div>
              <div>
                <p className="text-sm text-gray-500">Retained Revenue</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-green-600">
                    ₹{Math.round(metrics.repeatRevenue).toLocaleString('en-IN')}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+5.1% vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SUPERVISOR PERFORMANCE TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Supervisor Performance (Top Washers)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Washer/Supervisor</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Avg Ticket</TableHead>
                <TableHead className="text-right">Missed Services</TableHead>
                <TableHead className="text-right">Refund %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisorPerformanceData.map((row, index) => (
                <TableRow key={index} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">{row.supervisor}</TableCell>
                  <TableCell className="text-right">₹{row.revenue.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">{row.orders}</TableCell>
                  <TableCell className="text-right">₹{row.avgTicket.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.missedServices < 5 ? "default" : "destructive"}>
                      {row.missedServices}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.refundPercent < 3 ? "default" : "destructive"}>
                      {row.refundPercent}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
