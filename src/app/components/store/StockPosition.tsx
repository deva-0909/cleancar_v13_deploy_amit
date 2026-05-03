import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Search, Eye, FileText, AlertTriangle, TrendingDown, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { useInventory } from "../../contexts/InventoryContext";

export function StockPosition() {
  const { items } = useInventory();
  const [viewMode, setViewMode] = useState<"item" | "batch" | "location">("item");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLedgerDialog, setShowLedgerDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return <Badge variant="default" className="bg-green-600">In Stock</Badge>;
      case "Low Stock":
        return <Badge variant="default" className="bg-amber-600">Low Stock</Badge>;
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "Out of Stock":
        return <Badge variant="destructive" className="animate-pulse">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBatchStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case "Partially Consumed":
        return <Badge variant="secondary">Partially Consumed</Badge>;
      case "Fully Consumed":
        return <Badge variant="outline">Fully Consumed</Badge>;
      case "Expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "Written Off":
        return <Badge variant="destructive">Written Off</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewLedger = (item: any) => {
    setSelectedItem(item);
    setShowLedgerDialog(true);
  };

  const filteredStock = items.filter(item => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterStatus !== "all" && item.stockStatus !== filterStatus) return false;
    if (searchTerm && !item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Sort by stock status (critical first)
  const sortedStock = [...filteredStock].sort((a, b) => {
    const statusOrder = { "Out of Stock": 0, "Critical": 1, "Low Stock": 2, "In Stock": 3 };
    return statusOrder[a.stockStatus as keyof typeof statusOrder] - statusOrder[b.stockStatus as keyof typeof statusOrder];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Stock Position</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time inventory status — quantities only
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md border">
        <Label className="font-medium">View Mode:</Label>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "item" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("item")}
          >
            Item View
          </Button>
          <Button
            variant={viewMode === "batch" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("batch")}
          >
            Batch View
          </Button>
          <Button
            variant={viewMode === "location" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("location")}
          >
            Location View
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Item</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by item name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Chemicals">Chemicals</SelectItem>
                  <SelectItem value="Consumables">Consumables</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Protective Gear">Protective Gear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stock Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select defaultValue="status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Stock Status (Critical First)</SelectItem>
                  <SelectItem value="name">Item Name</SelectItem>
                  <SelectItem value="stock-asc">Closing Stock (Lowest First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item View Table */}
      {viewMode === "item" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Stock Position — {sortedStock.length} Items
            </CardTitle>
            <p className="text-xs text-gray-500">No prices or values shown</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Issued</TableHead>
                  <TableHead className="text-right">Adjustments</TableHead>
                  <TableHead className="text-right">Closing Stock</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStock.map((item) => (
                  <TableRow key={item.itemId} className="hover:bg-gray-50">
                    <TableCell className="font-medium font-mono text-xs">{item.itemId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-xs text-gray-500">{item.subCategory}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.openingStock} {item.unit}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">+{item.receivedMonth}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">-{item.issuedMonth}</TableCell>
                    <TableCell className="text-right">
                      {item.adjustmentsMonth > 0 ? `+${item.adjustmentsMonth}` : item.adjustmentsMonth}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={
                        item.stockStatus === "Out of Stock" ? "text-red-600" :
                        item.stockStatus === "Critical" ? "text-red-600" :
                        item.stockStatus === "Low Stock" ? "text-amber-600" :
                        "text-gray-900"
                      }>
                        {item.closingStock} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-gray-600">{item.reorderLevel}</TableCell>
                    <TableCell>{getStockStatusBadge(item.stockStatus)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewLedger(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Batch View Table */}
      {viewMode === "batch" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batch View — FIFO Order</CardTitle>
            <p className="text-xs text-gray-500">Oldest batches first per item</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Receipt Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Days to Expiry</TableHead>
                  <TableHead className="text-right">Qty Received</TableHead>
                  <TableHead className="text-right">Qty Issued</TableHead>
                  <TableHead className="text-right">Qty Remaining</TableHead>
                  <TableHead>Batch Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {([] as any[]).map((batch, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{batch.itemName}</TableCell>
                    <TableCell className="font-mono text-xs">{batch.batchNumber}</TableCell>
                    <TableCell>{batch.receiptDate}</TableCell>
                    <TableCell className={batch.daysToExpiry < 30 ? "text-red-600 font-medium" : batch.daysToExpiry < 90 ? "text-amber-600" : ""}>
                      {batch.expiryDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={batch.daysToExpiry < 30 ? "destructive" : batch.daysToExpiry < 90 ? "default" : "outline"} className={batch.daysToExpiry < 90 ? "bg-amber-600" : ""}>
                        {batch.daysToExpiry} days
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{batch.quantityReceived}</TableCell>
                    <TableCell className="text-right text-red-600">{batch.quantityIssued}</TableCell>
                    <TableCell className="text-right font-bold">{batch.quantityRemaining}</TableCell>
                    <TableCell>{getBatchStatusBadge(batch.batchStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Location View */}
      {viewMode === "location" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Storage Location View</CardTitle>
            <p className="text-xs text-gray-500">Physical store organization</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Main Store Shelf 1</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>Car Wash Shampoo 5L — BATCH-SHMP-20260115-001</span>
                    <span className="font-medium">20 Liters</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>Wheel Cleaner 1L — BATCH-WCL-20260201-004</span>
                    <span className="font-medium">25 Liters</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Main Store Shelf 2</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>Microfiber Towel Premium</span>
                    <span className="font-medium">115 Pieces</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Equipment Rack A</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>Foam Gun</span>
                    <span className="font-medium">8 Pieces</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dead Stock Tab */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Dead Stock
            </CardTitle>
            <Badge variant="outline">2 Items</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">No movement in last 60 days</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty in Stock</TableHead>
                <TableHead>Last Issuance Date</TableHead>
                <TableHead className="text-right">Days Since Movement</TableHead>
                <TableHead>Batch Number(s)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Safety Gloves</TableCell>
                <TableCell>Protective Gear</TableCell>
                <TableCell className="text-right">0 Pairs</TableCell>
                <TableCell>—</TableCell>
                <TableCell className="text-right text-red-600">—</TableCell>
                <TableCell className="text-xs">—</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Flagging for OM review")}>
                    <AlertTriangle className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Item Stock Ledger Dialog */}
      <Dialog open={showLedgerDialog} onOpenChange={setShowLedgerDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Ledger — {selectedItem?.itemName}</DialogTitle>
            <DialogDescription>Complete transaction history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Qty In</TableHead>
                  <TableHead className="text-right">Qty Out</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Actioned By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>2026-03-01</TableCell>
                  <TableCell>Opening Balance</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-medium">120</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>System</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2026-03-05</TableCell>
                  <TableCell>GRN Receipt</TableCell>
                  <TableCell className="font-mono text-xs">GRN-202603-008</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">+80</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-medium">200</TableCell>
                  <TableCell className="font-mono text-xs">BATCH-SHMP-20260201-002</TableCell>
                  <TableCell>Suresh Bhai</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2026-03-10</TableCell>
                  <TableCell>Issuance</TableCell>
                  <TableCell className="font-mono text-xs">ISS-202603-045</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right text-red-600 font-medium">-155</TableCell>
                  <TableCell className="text-right font-medium">45</TableCell>
                  <TableCell className="font-mono text-xs">BATCH-SHMP-20260115-001</TableCell>
                  <TableCell>Suresh Bhai</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
