import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { type VehicleCategory, type PlanType } from "../../data/subscriptionPlans";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import {
  getTotalCostPerWash,
  getMonthlyCost,
  calculateEBITDA,
  getEBITDAStatus,
  getPriceForTargetEBITDA,
  EBITDA_FLOOR,
  EBITDA_TARGET,
  EBITDA_ASPIRATIONAL,
  WORKING_DAYS_PER_MONTH,
} from "../../data/ebitdaCalculations";
import { AlertCircle, TrendingUp, TrendingDown, Info } from "lucide-react";

export function EBITDADashboard() {
  const { CURRENT_PLAN_VERSION, VEHICLE_CATEGORIES, PLAN_TYPES, formatPrice } = usePlanDefinitions();
  const [withIncentive, setWithIncentive] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCategory>("Hatchback / Compact Sedan");

  const vehicleType = selectedVehicle.includes("2W") ? "2W" : "4W";

  // Calculate EBITDA for all subscription plans (exclude One-Time)
  const subscriptionPlans = PLAN_TYPES.filter((plan) => !plan.includes("One-Time"));

  const planAnalysis = subscriptionPlans
    .map((plan) => {
      const price = CURRENT_PLAN_VERSION.pricingMatrix[selectedVehicle][
        plan as PlanType
      ];
      if (price === "NA") return null;

      const costBreakdown = getTotalCostPerWash(plan, vehicleType, withIncentive);
      const monthlyCost = getMonthlyCost(costBreakdown.total);
      const ebitda = calculateEBITDA(price as number, monthlyCost);
      const status = getEBITDAStatus(ebitda.ebitdaPercentage);

      const priceFor30 = getPriceForTargetEBITDA(monthlyCost, EBITDA_FLOOR);
      const priceFor35 = getPriceForTargetEBITDA(monthlyCost, EBITDA_TARGET);
      const priceFor60 = getPriceForTargetEBITDA(monthlyCost, EBITDA_ASPIRATIONAL);

      return {
        plan,
        price: price as number,
        costBreakdown,
        costPerWash: costBreakdown.total,
        monthlyCost,
        ebitda,
        status,
        priceFor30,
        priceFor35,
        priceFor60,
      };
    })
    .filter(Boolean);

  // Calculate summary stats
  const avgEBITDA = planAnalysis.length > 0
    ? planAnalysis.reduce((sum, p) => sum + (p?.ebitda.ebitdaPercentage || 0), 0) / planAnalysis.length
    : 0;

  const plansAboveTarget = planAnalysis.filter(
    (p) => p && p.ebitda.ebitdaPercentage >= EBITDA_TARGET
  ).length;

  const plansBelowFloor = planAnalysis.filter(
    (p) => p && p.ebitda.ebitdaPercentage < EBITDA_FLOOR
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>EBITDA Analysis Dashboard</CardTitle>
          <CardDescription>
            Complete margin analysis per plan with cost build-up and pricing
            recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">
                Vehicle Category
              </label>
              <Select
                value={selectedVehicle}
                onValueChange={(value: any) => setSelectedVehicle(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">
                Cost Scenario
              </label>
              <Select
                value={withIncentive ? "incentive" : "base"}
                onValueChange={(value) => setWithIncentive(value === "incentive")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">BASE (No Incentive)</SelectItem>
                  <SelectItem value="incentive">WITH INCENTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average EBITDA</CardDescription>
                <CardTitle
                  className={`text-2xl ${
                    avgEBITDA >= EBITDA_TARGET
                      ? "text-green-600"
                      : avgEBITDA >= EBITDA_FLOOR
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {(avgEBITDA * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Plans Above 35% Target</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {plansAboveTarget}/{planAnalysis.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Plans Below 30% Floor</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {plansBelowFloor}/{planAnalysis.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>EBITDA Floor</CardDescription>
                <CardTitle className="text-2xl">
                  {(EBITDA_FLOOR * 100).toFixed(0)}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">EBITDA Summary</TabsTrigger>
              <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Analysis</TabsTrigger>
            </TabsList>

            {/* EBITDA Summary */}
            <TabsContent value="summary">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Cost/Wash</TableHead>
                      <TableHead>Monthly Cost</TableHead>
                      <TableHead>EBITDA Amount</TableHead>
                      <TableHead>EBITDA %</TableHead>
                      <TableHead>vs 35% Target</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planAnalysis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No plans available for this vehicle category
                        </TableCell>
                      </TableRow>
                    ) : (
                      planAnalysis.map((analysis) => {
                        if (!analysis) return null;

                        const gap =
                          analysis.ebitda.ebitdaPercentage >= EBITDA_TARGET
                            ? 0
                            : analysis.priceFor35 - analysis.price;

                        return (
                          <TableRow key={analysis.plan}>
                            <TableCell className="font-medium">
                              {analysis.plan}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatPrice(analysis.price)}
                            </TableCell>
                            <TableCell>
                              {formatPrice(Math.round(analysis.costPerWash))}
                            </TableCell>
                            <TableCell>
                              {formatPrice(Math.round(analysis.monthlyCost))}
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {formatPrice(
                                Math.round(analysis.ebitda.ebitdaAmount)
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${analysis.status.color} font-semibold`}
                              >
                                {analysis.status.emoji}{" "}
                                {(
                                  analysis.ebitda.ebitdaPercentage * 100
                                ).toFixed(1)}
                                %
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {gap > 0 ? (
                                <span className="text-sm text-red-600">
                                  +{formatPrice(Math.round(gap))} needed
                                </span>
                              ) : (
                                <span className="text-sm text-green-600">
                                  Already ✅
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  analysis.status.status === "EXCELLENT" ||
                                  analysis.status.status === "GOOD"
                                    ? "default"
                                    : analysis.status.status === "ACCEPTABLE"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {analysis.status.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Cost Breakdown */}
            <TabsContent value="breakdown">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Labour</TableHead>
                      <TableHead>Consumables</TableHead>
                      <TableHead>Cloth</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Laundry</TableHead>
                      <TableHead>Fixed O/H</TableHead>
                      <TableHead>Total Cost/Wash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planAnalysis.map((analysis) => {
                      if (!analysis) return null;

                      return (
                        <TableRow key={analysis.plan}>
                          <TableCell className="font-medium">
                            {analysis.plan}
                          </TableCell>
                          <TableCell>
                            ₹{analysis.costBreakdown.labour.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ₹{analysis.costBreakdown.consumables.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ₹{analysis.costBreakdown.cloth.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ₹{analysis.costBreakdown.equipment.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ₹{analysis.costBreakdown.laundry.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ₹{analysis.costBreakdown.fixedOverhead.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{analysis.costBreakdown.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Cost Component Percentages */}
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Cost Component Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {planAnalysis.map((analysis) => {
                    if (!analysis) return null;

                    const total = analysis.costBreakdown.total;
                    const labourPct = (analysis.costBreakdown.labour / total) * 100;
                    const consumablesPct =
                      (analysis.costBreakdown.consumables / total) * 100;
                    const otherPct = 100 - labourPct - consumablesPct;

                    return (
                      <Card key={analysis.plan}>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            {analysis.plan}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Labour:</span>
                              <span className="font-semibold">
                                {labourPct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Consumables:</span>
                              <span className="font-semibold">
                                {consumablesPct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Other (Cloth+Equip+Overhead):</span>
                              <span className="font-semibold">
                                {otherPct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Pricing Analysis */}
            <TabsContent value="pricing">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Price @ 30% EBITDA</TableHead>
                      <TableHead>Price @ 35% EBITDA</TableHead>
                      <TableHead>Price @ 60% EBITDA</TableHead>
                      <TableHead>Gap to 35%</TableHead>
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planAnalysis.map((analysis) => {
                      if (!analysis) return null;

                      const gapTo35 = analysis.priceFor35 - analysis.price;

                      return (
                        <TableRow key={analysis.plan}>
                          <TableCell className="font-medium">
                            {analysis.plan}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(analysis.price)}
                          </TableCell>
                          <TableCell>
                            {formatPrice(Math.round(analysis.priceFor30))}
                          </TableCell>
                          <TableCell className="font-semibold text-blue-600">
                            {formatPrice(Math.round(analysis.priceFor35))}
                          </TableCell>
                          <TableCell>
                            {formatPrice(Math.round(analysis.priceFor60))}
                          </TableCell>
                          <TableCell>
                            {gapTo35 > 0 ? (
                              <span className="text-red-600 font-semibold">
                                +{formatPrice(Math.round(gapTo35))}
                              </span>
                            ) : (
                              <span className="text-green-600 font-semibold">
                                ✓ At target
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {analysis.ebitda.ebitdaPercentage < EBITDA_FLOOR ? (
                              <Badge variant="destructive" className="text-xs">
                                Below floor - reprice needed
                              </Badge>
                            ) : analysis.ebitda.ebitdaPercentage <
                              EBITDA_TARGET ? (
                              <Badge variant="secondary" className="text-xs">
                                Below target - consider upsell
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Good margin
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Alerts */}
              <div className="mt-6 space-y-4">
                {plansBelowFloor > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <CardTitle className="text-base text-red-900">
                          Critical: {plansBelowFloor} Plan(s) Below 30% EBITDA
                          Floor
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-red-800">
                        These plans cannot be sold at current prices as they
                        breach the system-enforced EBITDA floor. Immediate
                        repricing or removal from catalog required.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base text-blue-900">
                        EBITDA Principles
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-blue-800 space-y-2">
                    <p>
                      • <strong>30% Floor:</strong> System hard limit - no deal
                      can proceed below this threshold
                    </p>
                    <p>
                      • <strong>35% Target:</strong> Comfortable operating
                      margin for sustainable growth
                    </p>
                    <p>
                      • <strong>60% Aspirational:</strong> High-value
                      bundle/tier goal with add-ons
                    </p>
                    <p>
                      • Revenue per wash = Monthly price ÷ {WORKING_DAYS_PER_MONTH} working
                      days
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
