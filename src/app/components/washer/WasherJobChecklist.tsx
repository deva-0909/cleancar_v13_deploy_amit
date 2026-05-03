// Job Checklist Tab - Core execution with before/after photos
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { JobActivityTracker } from "./JobActivityTracker";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  name: string;
  completed: boolean;
  skipped: boolean;
  skipReason?: string;
}

interface ChecklistSection {
  id: string;
  name: string;
  items: ChecklistItem[];
  isOpen: boolean;
}

interface WasherJobChecklistProps {
  job: any;
  onChecklistChange: (complete: boolean, photos: boolean, autoAdvance?: string) => void;
  isInProgress: boolean;
}

export function WasherJobChecklist({ job, onChecklistChange, isInProgress }: WasherJobChecklistProps) {
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const beforePhotoInputRef = useRef<HTMLInputElement>(null);
  const afterPhotoInputRef = useRef<HTMLInputElement>(null);
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      id: "exterior",
      name: "Exterior Wash",
      isOpen: true,
      items: [
        { id: "ext-1", name: "Pre-rinse vehicle body", completed: false, skipped: false },
        { id: "ext-2", name: "Apply foam wash", completed: false, skipped: false },
        { id: "ext-3", name: "Scrub body panels", completed: false, skipped: false },
        { id: "ext-4", name: "Clean wheels and tires", completed: false, skipped: false },
        { id: "ext-5", name: "Rinse thoroughly", completed: false, skipped: false },
        { id: "ext-6", name: "Dry with microfiber towels", completed: false, skipped: false },
      ],
    },
    {
      id: "shampoo",
      name: "Shampoo Treatment",
      isOpen: true,
      items: [
        { id: "sha-1", name: "Apply shampoo solution", completed: false, skipped: false },
        { id: "sha-2", name: "Work into paint surface", completed: false, skipped: false },
        { id: "sha-3", name: "Rinse off completely", completed: false, skipped: false },
      ],
    },
    {
      id: "wax",
      name: "Wax Protection",
      isOpen: true,
      items: [
        { id: "wax-1", name: "Apply wax coating", completed: false, skipped: false },
        { id: "wax-2", name: "Buff to shine", completed: false, skipped: false },
      ],
    },
    {
      id: "interior",
      name: "Interior Cleaning",
      isOpen: true,
      items: [
        { id: "int-1", name: "Vacuum cabin floors", completed: false, skipped: false },
        { id: "int-2", name: "Vacuum seats", completed: false, skipped: false },
        { id: "int-3", name: "Wipe dashboard", completed: false, skipped: false },
        { id: "int-4", name: "Clean door panels", completed: false, skipped: false },
        { id: "int-5", name: "Apply dashboard polish", completed: false, skipped: false },
      ],
    },
    {
      id: "quality",
      name: "Quality Check",
      isOpen: true,
      items: [
        { id: "qc-1", name: "Check for water spots", completed: false, skipped: false },
        { id: "qc-2", name: "Verify all panels clean", completed: false, skipped: false },
        { id: "qc-3", name: "Check tire shine applied", completed: false, skipped: false },
        { id: "qc-4", name: "Inspect interior cleanliness", completed: false, skipped: false },
        { id: "qc-5", name: "Final walk-around inspection", completed: false, skipped: false },
      ],
    },
  ]);

  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [skipItem, setSkipItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  const [skipReason, setSkipReason] = useState("");

  // Calculate progress
  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
  const completedItems = sections.reduce(
    (sum, section) => sum + section.items.filter(item => item.completed).length,
    0
  );
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const qualityCheckComplete = sections
    .find(s => s.id === "quality")
    ?.items.every(item => item.completed || item.skipped) || false;

  const canTakeAfterPhoto = qualityCheckComplete;

  useEffect(() => {
    const allComplete = sections.every(section =>
      section.items.every(item => item.completed || item.skipped)
    );
    const photosComplete = beforePhoto !== null && afterPhoto !== null;
    onChecklistChange(allComplete, photosComplete);
  }, [sections, beforePhoto, afterPhoto, onChecklistChange]);

  // Auto-collapse completed sections
  useEffect(() => {
    setSections(prev =>
      prev.map(section => {
        const allDone = section.items.every(item => item.completed || item.skipped);
        if (allDone && section.id !== "quality") {
          return { ...section, isOpen: false };
        }
        return section;
      })
    );
  }, [sections]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const photoUrl = readerEvent.target?.result as string;

        if (type === "before") {
          setBeforePhoto(photoUrl);
          toast.success("Before photo uploaded - proceeding to checklist");
          setTimeout(() => {
            const firstSection = document.querySelector('[id^="checklist-section"]');
            if (firstSection) {
              firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        } else {
          setAfterPhoto(photoUrl);
          toast.success("After photo uploaded - advancing to report");
          const allComplete = sections.every(section =>
            section.items.every(item => item.completed || item.skipped)
          );
          onChecklistChange(allComplete, true, "report");
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handlePhotoCapture = (type: "before" | "after") => {
    // For Figma Make demo: Simulate photo capture immediately
    const simulatedPhoto = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%2398e5c2" width="400" height="300"/><text x="50%" y="45%" text-anchor="middle" fill="%23047857" font-size="24" font-weight="bold">${type.toUpperCase()} PHOTO</text><text x="50%" y="55%" text-anchor="middle" fill="%23065f46" font-size="16">Photo Captured ✓</text></svg>`;

    if (type === "before") {
      setBeforePhoto(simulatedPhoto);
      toast.success("Before photo captured - proceeding to checklist");
      setTimeout(() => {
        const firstSection = document.querySelector('[id^="checklist-section"]');
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } else {
      setAfterPhoto(simulatedPhoto);
      toast.success("After photo captured - advancing to report");
      const allComplete = sections.every(section =>
        section.items.every(item => item.completed || item.skipped)
      );
      onChecklistChange(allComplete, true, "report");
    }
  };

  const handleUploadPhoto = (type: "before" | "after") => {
    // Optionally trigger file upload
    if (type === "before") {
      beforePhotoInputRef.current?.click();
    } else {
      afterPhotoInputRef.current?.click();
    }
  };

  const handleItemToggle = (sectionId: string, itemId: string) => {
    if (!beforePhoto) {
      toast.error("Please take the before photo first");
      return;
    }

    setSections(prev =>
      prev.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                return { ...item, completed: !item.completed, skipped: false, skipReason: undefined };
              }
              return item;
            }),
          };
        }
        return section;
      })
    );
  };

  const handleSkipItem = (sectionId: string, itemId: string) => {
    setSkipItem({ sectionId, itemId });
    setSkipDialogOpen(true);
    setSkipReason("");
  };

  const confirmSkip = () => {
    if (!skipReason.trim()) {
      toast.error("Please provide a reason for skipping");
      return;
    }

    if (skipItem) {
      setSections(prev =>
        prev.map(section => {
          if (section.id === skipItem.sectionId) {
            return {
              ...section,
              items: section.items.map(item => {
                if (item.id === skipItem.itemId) {
                  return { ...item, skipped: true, completed: false, skipReason: skipReason };
                }
                return item;
              }),
            };
          }
          return section;
        })
      );
      setSkipDialogOpen(false);
      toast.success("Item skipped");
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId ? { ...section, isOpen: !section.isOpen } : section
      )
    );
  };

  const getProgressColor = () => {
    if (progress < 50) return "bg-red-500";
    if (progress < 80) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Hidden file inputs for photo upload */}
      <input
        ref={beforePhotoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "before")}
        className="hidden"
      />
      <input
        ref={afterPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "after")}
        className="hidden"
      />

      {/* Activity Tracking Indicator */}
      {isInProgress && beforePhoto && (
        <JobActivityTracker jobId={job.id} showTimestamps />
      )}

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {completedItems} of {totalItems} services completed
              </span>
              <span className="text-lg font-bold text-gray-900">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3" />
              <div
                className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Before Photo */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">Before Photo — Required</h3>
            </div>
            
            {!beforePhoto ? (
              <Button
                onClick={() => handlePhotoCapture("before")}
                className="w-full h-32 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Camera className="w-8 h-8" />
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-lg font-semibold">Take Before Photo</p>
                  <p className="text-xs mt-1 opacity-90">Click to capture</p>
                </div>
              </Button>
            ) : (
              <div className="space-y-2">
                <img
                  src={beforePhoto}
                  alt="Before"
                  className="w-full h-40 object-cover rounded-lg border-2 border-green-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Photo captured</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePhotoCapture("before")}
                  >
                    Retake
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      {!beforePhoto && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              Take the before photo to start the checklist
            </p>
          </div>
        </div>
      )}

      {sections.map((section) => {
        const sectionComplete = section.items.every(item => item.completed || item.skipped);
        const completedCount = section.items.filter(item => item.completed).length;
        const totalCount = section.items.length;

        return (
          <Collapsible
            key={section.id}
            open={section.isOpen}
            onOpenChange={() => toggleSection(section.id)}
          >
            <Card className={sectionComplete ? "border-green-500" : ""}>
              <CollapsibleTrigger asChild>
                <CardContent className="pt-6 pb-6 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="font-semibold text-gray-900">{section.name}</h3>
                      <Badge variant={sectionComplete ? "default" : "outline"} className={sectionComplete ? "bg-green-500" : ""}>
                        {completedCount} / {totalCount}
                      </Badge>
                      {sectionComplete && (
                        <Badge className="bg-green-500">Complete</Badge>
                      )}
                    </div>
                    {section.isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-6 space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Checkbox
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={() => handleItemToggle(section.id, item.id)}
                            className="h-7 w-7 rounded-full data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                            disabled={!beforePhoto}
                          />
                          <label
                            htmlFor={item.id}
                            className={`text-base cursor-pointer ${
                              item.completed
                                ? "text-gray-500 line-through"
                                : item.skipped
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {item.name}
                          </label>
                        </div>
                        {item.skipped && item.skipReason && (
                          <div className="ml-10 mt-1 flex items-center gap-2 text-xs text-red-600">
                            <X className="w-3 h-3" />
                            Skipped: {item.skipReason}
                          </div>
                        )}
                      </div>
                      {!item.completed && !item.skipped && beforePhoto && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSkipItem(section.id, item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Skip
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* After Photo */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">After Photo — Required</h3>
            </div>
            
            {!canTakeAfterPhoto && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    Complete all Quality Check items first
                  </p>
                </div>
              </div>
            )}

            {canTakeAfterPhoto && !afterPhoto && (
              <Button
                onClick={() => handlePhotoCapture("after")}
                className="w-full h-32 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Camera className="w-8 h-8" />
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-lg font-semibold">Take / Upload After Photo</p>
                </div>
              </Button>
            )}

            {afterPhoto && (
              <div className="space-y-2">
                <img
                  src={afterPhoto}
                  alt="After"
                  className="w-full h-40 object-cover rounded-lg border-2 border-green-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Photo captured</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePhotoCapture("after")}
                  >
                    Retake
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      {beforePhoto && afterPhoto && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Before & After Comparison</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Before</p>
                <img src={beforePhoto} alt="Before" className="w-full h-24 object-cover rounded" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">After</p>
                <img src={afterPhoto} alt="After" className="w-full h-24 object-cover rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Checklist Item</DialogTitle>
            <DialogDescription>
              Please provide a reason for skipping this item. This will be reviewed by your Supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter reason for skipping (required)"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="min-h-24 text-base"
            />
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSkip} className="bg-red-600 hover:bg-red-700">
              Confirm Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
