// Dashboard for HR role
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Users, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MASTER_KPI_DATA } from "../../data/masterData";
import { getActiveEmployees } from "../../data/employeeData";

export function HRDashboard() {
  const navigate = useNavigate();

  const handleApproveLeave = (employeeName: string) => {
    toast.success(`Leave approved for ${employeeName}`);
  };

  const handleRejectLeave = (employeeName: string) => {
    toast.error(`Leave rejected for ${employeeName}`);
  };

  // Use centralized employee data
  const activeEmployees = getActiveEmployees();

  const stats = {
    totalEmployees: MASTER_KPI_DATA.totalEmployees,
    pendingLeaves: 1,
    exitClearances: 1,
    newJoinings: 2,
  };

  // Leave requests from centralized data
  const leaveRequests = [
    { employee: "Rahul Verma", type: "Sick Leave", days: 2, from: "2026-02-28", status: "Pending", empCode: "EMP-WA-2026-045" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Management Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Employee lifecycle management</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate("/hr/lifecycle-management")}
        >
          <Users className="w-4 h-4 mr-2" />
          Add New Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              <p className="text-xs text-gray-500">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingLeaves}</p>
              <p className="text-xs text-gray-500">Pending Leaves</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.exitClearances}</p>
              <p className="text-xs text-gray-500">Exit Clearances</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.newJoinings}</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Leave Approvals */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Pending Leave Approvals</h3>
          <div className="space-y-3">
            {leaveRequests.map((leave, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{leave.employee}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>{leave.type}</span>
                    <span>{leave.days} days</span>
                    <span>From: {leave.from}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproveLeave(leave.employee)}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectLeave(leave.employee)}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
