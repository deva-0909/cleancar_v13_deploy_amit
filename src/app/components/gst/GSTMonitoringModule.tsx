import { useState, useMemo } from "react";
import { Activity, Download, AlertTriangle, TrendingUp } from "lucide-react";
import { showExportMenu } from "../../utils/gstExportUtils";

interface GSTINData {
  gstin: string;
  city: string;
  transactions: number;
  outputTax: number;
  itc: number;
  netPayable: number;
  riskScore: number;
  filingStatus: "Filed" | "Pending" | "Delayed";
  anomaliesCount: number;
}

interface Alert {
  id: string;
  type: "vendor-cross-city" | "duplicate-invoice" | "high-risk-vendor";
  severity: "Critical" | "High" | "Medium";
  description: string;
  gstins: string[];
  date: string;
}

export function GSTMonitoringModule() {
  const [selectedMonth, setSelectedMonth] = useState("April 2026");

  const gstinData: GSTINData[] = useMemo(() => [
    {
      gstin: "24GAOPS5676E1Z3",
      city: "Ahmedabad",
      transactions: 150,
      outputTax: 945000,
      itc: 425000,
      netPayable: 520000,
      riskScore: 25,
      filingStatus: "Filed",
      anomaliesCount: 0
    },
    {
      gstin: "27GAOPS5676E1Z5",
      city: "Mumbai",
      transactions: 180,
      outputTax: 1250000,
      itc: 580000,
      netPayable: 670000,
      riskScore: 42,
      filingStatus: "Filed",
      anomaliesCount: 2
    },
    {
      gstin: "29GAOPS5676E1Z7",
      city: "Bangalore",
      transactions: 95,
      outputTax: 625000,
      itc: 310000,
      netPayable: 315000,
      riskScore: 18,
      filingStatus: "Pending",
      anomaliesCount: 0
    },
    {
      gstin: "06GAOPS5676E1Z9",
      city: "Delhi",
      transactions: 220,
      outputTax: 1450000,
      itc: 720000,
      netPayable: 730000,
      riskScore: 65,
      filingStatus: "Delayed",
      anomaliesCount: 5
    }
  ], []);

  const alerts: Alert[] = useMemo(() => [
    {
      id: "1",
      type: "vendor-cross-city",
      severity: "High",
      description: "Vendor ABC Traders (GSTIN: 24XXXXX) appeared in Mumbai transactions but has no presence in Mumbai's vendor master",
      gstins: ["24GAOPS5676E1Z3", "27GAOPS5676E1Z5"],
      date: "2026-04-15"
    },
    {
      id: "2",
      type: "duplicate-invoice",
      severity: "Critical",
      description: "Invoice number INV-2026-1234 found in both Ahmedabad and Delhi GSTINs",
      gstins: ["24GAOPS5676E1Z3", "06GAOPS5676E1Z9"],
      date: "2026-04-18"
    },
    {
      id: "3",
      type: "high-risk-vendor",
      severity: "Critical",
      description: "Vendor XYZ Supplies with 100 risk score transacted across Ahmedabad, Mumbai, and Delhi",
      gstins: ["24GAOPS5676E1Z3", "27GAOPS5676E1Z5", "06GAOPS5676E1Z9"],
      date: "2026-04-20"
    },
    {
      id: "4",
      type: "vendor-cross-city",
      severity: "Medium",
      description: "Vendor PQR Services registered in Gujarat appearing in Bangalore transactions",
      gstins: ["24GAOPS5676E1Z3", "29GAOPS5676E1Z7"],
      date: "2026-04-22"
    }
  ], []);

  const monthlyTrends = useMemo(() => [
    { month: "January 2026", gstin1: 32, gstin2: 45, gstin3: 22, gstin4: 58 },
    { month: "February 2026", gstin1: 28, gstin2: 48, gstin3: 19, gstin4: 62 },
    { month: "March 2026", gstin1: 22, gstin2: 40, gstin3: 15, gstin4: 68 },
    { month: "April 2026", gstin1: 25, gstin2: 42, gstin3: 18, gstin4: 65 }
  ], []);

  const kpis = useMemo(() => {
    const totalGSTINs = gstinData.length;
    const avgCompliance = Math.round(gstinData.reduce((s, g) => s + (100 - g.riskScore), 0) / totalGSTINs);
    const criticalRisk = gstinData.filter(g => g.riskScore > 60).length;
    const alertsThisMonth = alerts.length;

    return { totalGSTINs, avgCompliance, criticalRisk, alertsThisMonth };
  }, [gstinData, alerts]);

  const handleExportCityComparison = (e: React.MouseEvent) => {
    const data = gstinData.map(g => ({
      GSTIN: g.gstin,
      City: g.city,
      Transactions: g.transactions,
      "Output Tax": g.outputTax,
      ITC: g.itc,
      "Net Payable": g.netPayable,
      "Risk Score": g.riskScore,
      "Filing Status": g.filingStatus,
      "Anomalies": g.anomaliesCount
    }));
    showExportMenu(data, "gst-city-comparison", e.currentTarget as HTMLElement);
  };

  const handleExportAlerts = (e: React.MouseEvent) => {
    const data = alerts.map(a => ({
      Type: a.type,
      Severity: a.severity,
      Description: a.description,
      "Affected GSTINs": a.gstins.join(", "),
      Date: a.date
    }));
    showExportMenu(data, "gst-alerts", e.currentTarget as HTMLElement);
  };

  const handleExportTrends = (e: React.MouseEvent) => {
    const data = monthlyTrends.map(t => ({
      Month: t.month,
      "Ahmedabad (24...)": t.gstin1,
      "Mumbai (27...)": t.gstin2,
      "Bangalore (29...)": t.gstin3,
      "Delhi (06...)": t.gstin4
    }));
    showExportMenu(data, "gst-monthly-trends", e.currentTarget as HTMLElement);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-700 bg-red-100 border-red-200";
      case "High": return "text-orange-700 bg-orange-100 border-orange-200";
      case "Medium": return "text-amber-700 bg-amber-100 border-amber-200";
      default: return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getFilingStatusColor = (status: string) => {
    switch (status) {
      case "Filed": return "text-green-700 bg-green-100";
      case "Pending": return "text-blue-700 bg-blue-100";
      case "Delayed": return "text-red-700 bg-red-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-700";
    if (score < 60) return "text-amber-700";
    if (score < 80) return "text-orange-700";
    return "text-red-700";
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Cross-GSTIN Intelligence</h1>
            <p className="text-sm text-gray-600">Monitor compliance and anomalies across multiple GSTINs</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option>April 2026</option>
            <option>March 2026</option>
            <option>February 2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total GSTINs Monitored</div>
          <div className="text-2xl font-semibold text-gray-900">{kpis.totalGSTINs}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Compliance Score</div>
          <div className="text-2xl font-semibold text-green-600">{kpis.avgCompliance}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">GSTINs with Critical Risk</div>
          <div className="text-2xl font-semibold text-red-600">{kpis.criticalRisk}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Alerts This Month</div>
          <div className="text-2xl font-semibold text-orange-600">{kpis.alertsThisMonth}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">City/GSTIN Comparison</h3>
          <button
            onClick={handleExportCityComparison}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">GSTIN</th>
                <th className="pb-3 font-medium">City</th>
                <th className="pb-3 font-medium">Transactions</th>
                <th className="pb-3 font-medium">Output Tax</th>
                <th className="pb-3 font-medium">ITC</th>
                <th className="pb-3 font-medium">Net Payable</th>
                <th className="pb-3 font-medium">Risk Score</th>
                <th className="pb-3 font-medium">Filing Status</th>
                <th className="pb-3 font-medium">Anomalies</th>
              </tr>
            </thead>
            <tbody>
              {gstinData.map(g => (
                <tr key={g.gstin} className="border-b border-gray-100 text-sm">
                  <td className="py-3 font-mono text-xs">{g.gstin}</td>
                  <td className="py-3 font-medium text-gray-900">{g.city}</td>
                  <td className="py-3 text-gray-700">{g.transactions}</td>
                  <td className="py-3 text-gray-900">₹{g.outputTax.toLocaleString()}</td>
                  <td className="py-3 text-green-600">₹{g.itc.toLocaleString()}</td>
                  <td className="py-3 text-gray-900">₹{g.netPayable.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(g.riskScore)}`}>
                      {g.riskScore}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getFilingStatusColor(g.filingStatus)}`}>
                      {g.filingStatus}
                    </span>
                  </td>
                  <td className="py-3">
                    {g.anomaliesCount > 0 ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                        {g.anomaliesCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Pattern Anomaly Alerts</h3>
          </div>
          <button
            onClick={handleExportAlerts}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-600">{alert.date}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">{alert.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">Affected GSTINs:</span>
                    {alert.gstins.map(gstin => (
                      <span key={gstin} className="px-2 py-0.5 bg-white border border-gray-300 rounded font-mono">
                        {gstin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Monthly Risk Score Trends by GSTIN</h3>
          </div>
          <button
            onClick={handleExportTrends}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Month</th>
                <th className="pb-3 font-medium">Ahmedabad (24...)</th>
                <th className="pb-3 font-medium">Mumbai (27...)</th>
                <th className="pb-3 font-medium">Bangalore (29...)</th>
                <th className="pb-3 font-medium">Delhi (06...)</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrends.map(trend => (
                <tr key={trend.month} className="border-b border-gray-100 text-sm">
                  <td className="py-3 font-medium text-gray-900">{trend.month}</td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(trend.gstin1)}`}>
                      {trend.gstin1}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(trend.gstin2)}`}>
                      {trend.gstin2}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(trend.gstin3)}`}>
                      {trend.gstin3}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(trend.gstin4)}`}>
                      {trend.gstin4}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This dashboard is read-only and provides cross-GSTIN intelligence for monitoring purposes.
          All alerts are generated automatically based on pattern analysis across cities and vendors.
        </p>
      </div>
    </div>
  );
}
