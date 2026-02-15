import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket,
  CheckCircle,
  FileText,
  TrendingUp,
  LogOut,
  RotateCcw,
  XCircle,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Footer } from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import {
  AccessCode,
  CaseSubmission,
  searchAccessCodes,
  getRecentSubmissions,
  getAdminStats,
  createAccessCode,
  resetAccessCode,
  deactivateAccessCode,
} from "@/services/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ADMIN_PASSWORD = "admin123"; // For demo purposes

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [submissions, setSubmissions] = useState<CaseSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState(5);
  const [addingCode, setAddingCode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<AccessCode | null>(null);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    totalSubmissions: 0,
    todayRedemptions: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [codesData, submissionsData, statsData] = await Promise.all([
        searchAccessCodes(),
        getRecentSubmissions(),
        getAdminStats(),
      ]);
      setCodes(codesData);
      setSubmissions(submissionsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const filteredCodes = codes.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(false);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      setLoginError(true);
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
  };

  const handleAddCode = async () => {
    if (!newCode.trim()) return;

    setAddingCode(true);
    try {
      await createAccessCode(newCode.toUpperCase(), newMaxUses);
      setNewCode("");
      setNewMaxUses(5);
      await loadData();
      toast({ title: "Success", description: "Access code created." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create code.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
    setAddingCode(false);
  };

  const handleResetCode = async () => {
    if (!selectedCode) return;
    try {
      await resetAccessCode(selectedCode.id);
      await loadData();
      toast({ title: "Success", description: "Code reset successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to reset code.", variant: "destructive" });
    }
    setShowResetDialog(false);
    setSelectedCode(null);
  };

  const handleDeactivateCode = async () => {
    if (!selectedCode) return;
    try {
      await deactivateAccessCode(selectedCode.id);
      await loadData();
      toast({ title: "Success", description: "Code deactivated." });
    } catch {
      toast({ title: "Error", description: "Failed to deactivate code.", variant: "destructive" });
    }
    setShowDeactivateDialog(false);
    setSelectedCode(null);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="card-professional-elevated p-8">
              <h1 className="text-2xl font-bold text-foreground text-center mb-6">
                Admin Login
              </h1>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Enter admin password"
                    className="h-12"
                  />
                  {loginError && (
                    <p className="text-destructive text-sm mt-2">
                      Invalid password. Please try again.
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={!password || loginLoading}
                  className="w-full h-12"
                >
                  {loginLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  ← Back to Home
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Demo password: admin123
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      {/* Header */}
      <header className="bg-card border-b border-border py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<Ticket className="w-6 h-6" />} value={stats.totalCodes} label="Total Access Codes" color="default" />
                <StatCard icon={<CheckCircle className="w-6 h-6" />} value={stats.activeCodes} label="Active Codes" color="success" />
                <StatCard icon={<FileText className="w-6 h-6" />} value={stats.totalSubmissions} label="Cases Submitted" color="default" />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} value={stats.todayRedemptions} label="Today's Redemptions" color="primary" />
              </div>

              {/* Add New Code */}
              <div className="card-professional p-6 mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Add New Access Code</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="BOOK-2026-XXXX"
                    className="font-mono flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">Max uses:</label>
                    <Input
                      type="number"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 5)}
                      min={1}
                      max={100}
                      className="w-20"
                    />
                  </div>
                  <Button onClick={handleAddCode} disabled={!newCode.trim() || addingCode}>
                    {addingCode ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Access Codes Table */}
              <div className="card-professional p-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Manage Access Codes</h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by code..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Uses</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCodes.map((code) => (
                        <TableRow key={code.id} className={!code.active ? "opacity-50" : ""}>
                          <TableCell className="font-mono font-medium">{code.code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${(code.uses_count / code.max_uses) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {code.uses_count} / {code.max_uses}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {code.active ? (
                              <span className="badge-success">Active</span>
                            ) : (
                              <span className="badge-neutral">Inactive</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(code.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCode(code);
                                  setShowResetDialog(true);
                                }}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCode(code);
                                  setShowDeactivateDialog(true);
                                }}
                                disabled={!code.active}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="card-professional p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Recent Case Submissions</h2>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Title</TableHead>
                        <TableHead>Code Used</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No submissions yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium max-w-[300px] truncate">
                              {submission.title}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {submission.access_code_used}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(submission.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {submission.status === "analyzed" ? (
                                <span className="badge-success">Analyzed</span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  Submitted
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Access Code?</DialogTitle>
            <DialogDescription>
              Reset code <span className="font-mono font-medium">{selectedCode?.code}</span>? 
              This will set uses to 0 and reactivate it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button onClick={handleResetCode}>Reset Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Access Code?</DialogTitle>
            <DialogDescription>
              Deactivate code <span className="font-mono font-medium">{selectedCode?.code}</span>? 
              Users will no longer be able to use it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivateCode}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "default" | "success" | "primary";
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colorClasses = {
    default: "text-foreground",
    success: "text-success",
    primary: "text-primary",
  };

  return (
    <div className="card-professional p-5">
      <div className="flex items-center justify-between mb-2">
        <span className={colorClasses[color]}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default Admin;
