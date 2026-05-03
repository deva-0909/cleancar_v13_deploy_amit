import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { AlertCircle, Upload, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";

export function ExpenseEntry() {
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setDocumentUploaded(true);
      toast.success("Document uploaded successfully!");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!documentUploaded) {
      toast.error("Cannot save expense without supporting document!");
      return;
    }

    toast.success("Expense recorded successfully!");
    // Reset form
    e.currentTarget.reset();
    setDocumentUploaded(false);
    setFileName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Expense</h1>
          <p className="text-sm text-gray-500 mt-1">Enter expense details with supporting documentation</p>
        </div>
        <Link to="/accounts">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Document Upload Warning */}
      <Card className="bg-amber-50 border-amber-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Document Upload Required</p>
              <p className="text-sm text-amber-700 mt-1">
                Expense cannot be saved without uploading a supporting document (Receipt, Invoice, or Proof of Payment)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expense Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Expense Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="inventory">Inventory Purchase</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="salaries">Salaries</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expense Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Expense Type *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="vendor-payment">Vendor Payment</SelectItem>
                    <SelectItem value="misc">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vendor/Service Provider */}
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor / Service Provider *</Label>
                <Input 
                  id="vendor" 
                  name="vendor"
                  placeholder="Enter vendor name" 
                  required 
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input 
                  id="amount" 
                  name="amount"
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="0.00" 
                  required 
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label htmlFor="payment-mode">Payment Mode *</Label>
                <Select name="payment-mode" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date *</Label>
                <Input 
                  id="payment-date" 
                  name="payment-date"
                  type="date" 
                  required 
                />
              </div>

              {/* Related Service Zone/Region */}
              <div className="space-y-2">
                <Label htmlFor="zone">Related Service Zone / Region</Label>
                <Select name="zone">
                  <SelectTrigger>
                    <SelectValue placeholder="Select service zone/region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="surat">Surat - All Zones</SelectItem>
                    <SelectItem value="395005">395005 — Adajan</SelectItem>
                    <SelectItem value="395006">395006 — Vesu</SelectItem>
                    <SelectItem value="395009">395009 — Jahangirpura</SelectItem>
                    <SelectItem value="395007">395007 — Althan</SelectItem>
                    <SelectItem value="395008">395008 — Piplod</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* GST Applicable */}
              <div className="space-y-2">
                <Label htmlFor="gst">GST Applicable</Label>
                <Select name="gst">
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes (Include GST)</SelectItem>
                    <SelectItem value="no">No GST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Description</Label>
              <Textarea 
                id="notes" 
                name="notes"
                placeholder="Additional details about the expense..." 
                rows={3}
              />
            </div>

            {/* Document Upload - MANDATORY */}
            <div className="space-y-2">
              <Label htmlFor="document" className="flex items-center gap-2">
                Supporting Document * 
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="document"
                  name="document"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  required
                />
                <label htmlFor="document" className="cursor-pointer">
                  {documentUploaded ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                      <p className="font-medium text-green-600">Document Uploaded</p>
                      <p className="text-sm text-gray-600">{fileName}</p>
                      <Button type="button" variant="outline" size="sm">Change File</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <p className="font-medium text-gray-700">Upload Receipt / Invoice / Proof</p>
                      <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Discount as Marketing Expense Option */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <input
                    type="checkbox"
                    id="discount-marketing"
                    name="discount-marketing"
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <label htmlFor="discount-marketing" className="font-medium text-blue-900 cursor-pointer">
                      Treat Customer Discounts as Marketing Expense
                    </label>
                    <p className="text-sm text-blue-700 mt-1">
                      If enabled, customer discounts will automatically appear under Marketing Expense ledger
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={!documentUploaded}>
                <FileText className="w-4 h-4 mr-2" />
                Save Expense
              </Button>
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}