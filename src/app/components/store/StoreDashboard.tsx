import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertTriangle,
  Clock,
  Truck,
  ClipboardList,
  Package,
  FileText,
  Calendar,
  Wrench,
  TrendingDown,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MaterialRequisitionDrawer } from "./MaterialRequisitionDrawer";
import { GRNCreationDialog } from "./GRNCreationDialog";

// Mock data for alert panels
const reorderAlerts = [
  {
    id: 1,
    itemName: "Car Wash Shampoo 5L",
    category: "Chemicals",
    currentStock: 0,
    unit: "Liters",
    reorderLevel: 50,
    deficit: 50,
    lastIssued: "2026-03-15",
    status: "zero"
  },
  {
    id: 2,
    itemName: "Microfiber Towel Premium",
    category: "Consumables",
    currentStock: 45,
    unit: "Pieces",
    reorderLevel: 100,
    deficit: 55,
    lastIssued: "2026-03-16",
    status: "low"
  },
  {
    id: 3,
    itemName: "Wheel Cleaner 1L",
    category: "Chemicals",
    currentStock: 25,
    unit: "Liters",
    reorderLevel: 30,
    deficit: 5,
    lastIssued: "2026-03-14",
    status: "low"
  },
];

const expiryWatch = [
  {
    id: 1,
    materialName: "Wax Coating 1L",
    batchNumber: "BATCH-WAX-20260115-001",
    expiryDate: "2026-04-10",
    daysToExpiry: 24,
    quantityRemaining: 8,
    unit: "Liters"
  },
  {
    id: 2,
    materialName: "Interior Cleaner 5L",
    batchNumber: "BATCH-INT-20260201-003",
    expiryDate: "2026-04-15",
    daysToExpiry: 29,
    quantityRemaining: 12,
    unit: "Liters"
  },
  {
    id: 3,
    materialName: "Dashboard Cleaner 500ml",
    batchNumber: "BATCH-DASH-20260120-005",
    expiryDate: "2026-05-20",
    daysToExpiry: 64,
    quantityRemaining: 18,
    unit: "Liters"
  },
];

const pendingDeliveries = [
  {
    id: 1,
    poNumber: "PO-202603-015",
    supplierName: "CleanPro Supplies Pvt Ltd",
    expectedDeliveryDate: "2026-03-17",
    itemsExpected: 5,
    status: "today",
    daysOverdue: 0
  },
  {
    id: 2,
    poNumber: "PO-202603-012",
    supplierName: "Karcher India Pvt Ltd",
    expectedDeliveryDate: "2026-03-15",
    itemsExpected: 3,
    status: "overdue",
    daysOverdue: 2
  },
];

const pendingIssuanceRequests = [
  {
    id: 1,
    requestingSupervisor: "Rajesh Sharma",
    pinCodeZone: "395005 — Adajan",
    itemsRequested: 6,
    urgency: "Normal",
    requestDate: "2026-03-16"
  },
  {
    id: 2,
    requestingSupervisor: "Amit Bhatt",
    pinCodeZone: "395006 — Vesu",
    itemsRequested: 4,
    urgency: "Urgent",
    requestDate: "2026-03-17"
  },
];

const equipmentTasks = [
  {
    id: 1,
    type: "New Washer Kit Assignment",
    washerName: "Sunil Yadav",
    joiningDate: "2026-03-18",
    kitType: "Standard Washer Kit",
    status: "pending"
  },
  {
    id: 2,
    type: "Equipment Returns Pending",
    washerName: "Mohan Singh",
    reason: "Employee Exit",
    itemsCount: 8,
    status: "pending"
  },
  {
    id: 3,
    type: "Equipment Repair Return Awaited",
    equipmentName: "Foam Gun",
    equipmentId: "EQ-FG-0045",
    dispatchedDate: "2026-03-10",
    expectedReturn: "2026-03-18",
    status: "awaited"
  },
];

const purchaseReturnDispatch = [
  {
    id: 1,
    returnNumber: "RET-202603-002",
    supplierName: "CleanPro Supplies Pvt Ltd",
    itemsToReturn: 2,
    returnReason: "Damaged in Transit",
    returnCreatedDate: "2026-03-15",
    status: "Ready to Dispatch"
  },
];

const dailyStockMovement = {
  received: { items: 8, units: 245 },
  issued: { items: 12, units: 180 },
  adjusted: { entries: 2 },
  equipmentAssigned: { items: 5 },
  equipmentReceived: { items: 3 }
};

export function StoreDashboard() {
  const [mrDrawerOpen, setMrDrawerOpen] = useState(false);
  const [selectedItemForMR, setSelectedItemForMR] = useState<any>(null);
  const [grnDialogOpen, setGrnDialogOpen] = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<any>(null);

  const handleRaiseMR = (item: any) => {
    setSelectedItemForMR(item);
    setMrDrawerOpen(true);
  };

  const handleViewStockHistory = (item: any) => {
    toast.info("Opening stock ledger", {
      description: `Viewing history for ${item.itemName}`
    });
  };

  const handleFlagPriorityIssuance = (batch: any) => {
    toast.success("Batch flagged for priority issuance", {
      description: `"Use First" tag added to ${batch.batchNumber}`
    });
  };

  const handleCreateGRN = (po: any) => {
    console.log("Creating GRN for PO:", po);
    setSelectedPOForGRN(po);
    setGrnDialogOpen(true);
    toast.info("Opening GRN creation form...");
  };

  const handleProcessIssuance = (request: any) => {
    toast.success("Opening issuance execution screen", {
      description: `Processing request from ${request.requestingSupervisor}`
    });
  };

  const handleAssignKit = (task: any) => {
    toast.success("Opening kit assignment form", {
      description: `Assigning kit to ${task.washerName}`
    });
  };

  const handleReceiveReturn = (task: any) => {
    toast.success("Opening equipment return form", {
      description: `Receiving equipment from ${task.washerName}`
    });
  };

  const handleMarkDispatched = (returnItem: any) => {
    toast.success("Return dispatched successfully", {
      description: `${returnItem.returnNumber} marked as dispatched`
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Panels Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reorder Alerts Panel */}
        <Card className={reorderAlerts.some(a => a.status === "zero") ? "border-red-300 bg-red-50" : reorderAlerts.length > 0 ? "border-amber-300 bg-amber-50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${reorderAlerts.some(a => a.status === "zero") ? "text-red-600" : "text-amber-600"}`} />
                Reorder Alerts
              </CardTitle>
              <Badge variant={reorderAlerts.some(a => a.status === "zero") ? "destructive" : "default"}>
                {reorderAlerts.length}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Materials at or below reorder level</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {reorderAlerts.map((alert) => (
              <div key={alert.id} className={`border rounded-md p-3 ${alert.status === "zero" ? "bg-red-100 border-red-300" : "bg-white border-amber-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{alert.itemName}</p>
                    <p className="text-xs text-gray-600">{alert.category}</p>
                  </div>
                  {alert.status === "zero" && (
                    <Badge variant="destructive" className="text-xs">ZERO STOCK</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Current Stock:</span>
                    <span className={`ml-1 font-bold ${alert.status === "zero" ? "text-red-600" : "text-amber-600"}`}>
                      {alert.currentStock} {alert.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reorder Level:</span>
                    <span className="ml-1 font-medium">{alert.reorderLevel} {alert.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Deficit:</span>
                    <span className="ml-1 font-medium text-red-600">{alert.deficit} {alert.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Issued:</span>
                    <span className="ml-1 font-medium">{alert.lastIssued}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1" onClick={() => handleRaiseMR(alert)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Raise MR
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewStockHistory(alert)}>
                    <Eye className="w-3 h-3 mr-1" />
                    Stock History
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expiry Watch Panel */}
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Expiry Watch
              </CardTitle>
              <Badge variant="outline">{expiryWatch.length}</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Batches expiring within 90 days</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {expiryWatch.map((batch) => (
              <div key={batch.id} className={`border rounded-md p-3 ${batch.daysToExpiry < 30 ? "bg-red-100 border-red-300" : "bg-white border-amber-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{batch.materialName}</p>
                    <p className="text-xs text-gray-600 font-mono">{batch.batchNumber}</p>
                  </div>
                  <Badge variant={batch.daysToExpiry < 30 ? "destructive" : "outline"} className="text-xs">
                    {batch.daysToExpiry} days
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Expiry Date:</span>
                    <span className={`ml-1 font-medium ${batch.daysToExpiry < 30 ? "text-red-600" : "text-amber-600"}`}>
                      {batch.expiryDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity Remaining:</span>
                    <span className="ml-1 font-medium">{batch.quantityRemaining} {batch.unit}</span>
                  </div>
                </div>
                <Button size="sm" variant="default" className="w-full" onClick={() => handleFlagPriorityIssuance(batch)}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Flag for Priority Issuance
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alert Panels Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Deliveries Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Pending Deliveries
              </CardTitle>
              <Badge variant="secondary">{pendingDeliveries.length}</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Expected today and overdue</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingDeliveries.map((delivery) => (
              <div key={delivery.id} className={`border rounded-md p-3 ${delivery.status === "overdue" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{delivery.poNumber}</p>
                    <p className="text-xs text-gray-600">{delivery.supplierName}</p>
                  </div>
                  {delivery.status === "overdue" && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue — {delivery.daysOverdue} days
                    </Badge>
                  )}
                  {delivery.status === "today" && (
                    <Badge variant="default" className="text-xs">Expected Today</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Expected Date:</span>
                    <span className="ml-1 font-medium">{delivery.expectedDeliveryDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Items Expected:</span>
                    <span className="ml-1 font-medium">{delivery.itemsExpected}</span>
                  </div>
                </div>
                <Button size="sm" variant="default" className="w-full" onClick={() => handleCreateGRN(delivery)}>
                  <FileText className="w-3 h-3 mr-1" />
                  Create GRN
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Issuance Requests Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Pending Issuance Requests
              </CardTitle>
              <Badge variant="secondary">{pendingIssuanceRequests.length}</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Requests from supervisors</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingIssuanceRequests.map((request) => (
              <div key={request.id} className={`border rounded-md p-3 ${request.urgency === "Urgent" ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{request.requestingSupervisor}</p>
                    <p className="text-xs text-gray-600">{request.pinCodeZone}</p>
                  </div>
                  <Badge variant={request.urgency === "Urgent" ? "destructive" : "outline"} className="text-xs">
                    {request.urgency}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Items Requested:</span>
                    <span className="ml-1 font-medium">{request.itemsRequested}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Request Date:</span>
                    <span className="ml-1 font-medium">{request.requestDate}</span>
                  </div>
                </div>
                <Button size="sm" variant="default" className="w-full" onClick={() => handleProcessIssuance(request)}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Process Issuance
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alert Panels Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Tasks Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-teal-600" />
                Equipment Tasks
              </CardTitle>
              <Badge variant="secondary">{equipmentTasks.length}</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Tasks requiring action</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {equipmentTasks.map((task) => (
              <div key={task.id} className="border rounded-md p-3 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{task.type}</p>
                    <p className="text-xs text-gray-600">
                      {task.type === "New Washer Kit Assignment" && `${task.washerName} — ${task.kitType}`}
                      {task.type === "Equipment Returns Pending" && `${task.washerName} — ${task.itemsCount} items`}
                      {task.type === "Equipment Repair Return Awaited" && `${task.equipmentName} (${task.equipmentId})`}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  {task.type === "New Washer Kit Assignment" && `Joining Date: ${task.joiningDate}`}
                  {task.type === "Equipment Returns Pending" && `Reason: ${task.reason}`}
                  {task.type === "Equipment Repair Return Awaited" && `Dispatched: ${task.dispatchedDate} | Expected: ${task.expectedReturn}`}
                </div>
                <Button size="sm" variant="default" className="w-full" onClick={task.type === "New Washer Kit Assignment" ? () => handleAssignKit(task) : () => handleReceiveReturn(task)}>
                  {task.type === "New Washer Kit Assignment" && <><Package className="w-3 h-3 mr-1" /> Assign Kit</>}
                  {task.type === "Equipment Returns Pending" && <><CheckCircle className="w-3 h-3 mr-1" /> Receive Return</>}
                  {task.type === "Equipment Repair Return Awaited" && <><Clock className="w-3 h-3 mr-1" /> Track Status</>}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Purchase Return Dispatch Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                Purchase Return Dispatch
              </CardTitle>
              <Badge variant="secondary">{purchaseReturnDispatch.length}</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">Ready for physical dispatch</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchaseReturnDispatch.map((returnItem) => (
              <div key={returnItem.id} className="border rounded-md p-3 bg-orange-50 border-orange-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{returnItem.returnNumber}</p>
                    <p className="text-xs text-gray-600">{returnItem.supplierName}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{returnItem.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Items to Return:</span>
                    <span className="ml-1 font-medium">{returnItem.itemsToReturn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Return Reason:</span>
                    <span className="ml-1 font-medium">{returnItem.returnReason}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-1 font-medium">{returnItem.returnCreatedDate}</span>
                  </div>
                </div>
                <Button size="sm" variant="default" className="w-full" onClick={() => handleMarkDispatched(returnItem)}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mark as Dispatched
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Daily Stock Movement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Stock Movement — Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-xs text-gray-600 mb-1">Received (GRNs)</p>
              <p className="text-2xl font-bold text-green-600">{dailyStockMovement.received.items}</p>
              <p className="text-xs text-gray-500">{dailyStockMovement.received.units} units</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Issued</p>
              <p className="text-2xl font-bold text-blue-600">{dailyStockMovement.issued.items}</p>
              <p className="text-xs text-gray-500">{dailyStockMovement.issued.units} units</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-xs text-gray-600 mb-1">Adjusted</p>
              <p className="text-2xl font-bold text-amber-600">{dailyStockMovement.adjusted.entries}</p>
              <p className="text-xs text-gray-500">entries</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-md border border-purple-200">
              <p className="text-xs text-gray-600 mb-1">Equipment Assigned</p>
              <p className="text-2xl font-bold text-purple-600">{dailyStockMovement.equipmentAssigned.items}</p>
              <p className="text-xs text-gray-500">items</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-md border border-teal-200">
              <p className="text-xs text-gray-600 mb-1">Equipment Received</p>
              <p className="text-2xl font-bold text-teal-600">{dailyStockMovement.equipmentReceived.items}</p>
              <p className="text-xs text-gray-500">items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Requisition Drawer */}
      <MaterialRequisitionDrawer
        open={mrDrawerOpen}
        onClose={() => {
          setMrDrawerOpen(false);
          setSelectedItemForMR(null);
        }}
        prefilledItem={selectedItemForMR}
      />

      {/* GRN Creation Dialog */}
      <GRNCreationDialog
        open={grnDialogOpen}
        onClose={() => {
          setGrnDialogOpen(false);
          setSelectedPOForGRN(null);
        }}
        linkedPO={selectedPOForGRN}
      />
    </div>
  );
}