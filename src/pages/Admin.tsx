import { useState } from "react";
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
import {
  mockAccessCodes,
  mockSubmissions,
  AccessCode,
} from "@/lib/mockData";
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
  const [codes, setCodes] = useState<AccessCode[]>(mockAccessCodes);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState(5);
  const [addingCode, setAddingCode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<AccessCode | null>(null);

  // Stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => c.active).length;
  const totalSubmissions = mockSubmissions.length;
  const todayRedemptions = 8; // Mock value

  const filteredCodes = codes.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(false);

    await new Promise((resolve) => setTimeout(resolve, 1000));

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
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newAccessCode: AccessCode = {
      id: `new-${Date.now()}`,
      code: newCode.toUpperCase(),
      maxUses: newMaxUses,
      usesCount: 0,
      active: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCodes([newAccessCode, ...codes]);
    setNewCode("");
    setNewMaxUses(5);
    setAddingCode(false);
  };

  const handleResetCode = async () => {
    if (!selectedCode) return;

    setCodes(
      codes.map((c) =>
        c.id === selectedCode.id
          ? { ...c, usesCount: 0, active: true }
          : c
      )
    );
    setShowResetDialog(false);
    setSelectedCode(null);
  };

  const handleDeactivateCode = async () => {
    if (!selectedCode) return;

    setCodes(
      codes.map((c) =>
        c.id === selectedCode.id
          ? { ...c, active: false }
          : c
      )
    );
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Ticket className="w-6 h-6" />}
              value={totalCodes}
              label="Total Access Codes"
              color="default"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              value={activeCodes}
              label="Active Codes"
              color="success"
            />
            <StatCard
              icon={<FileText className="w-6 h-6" />}
              value={totalSubmissions}
              label="Cases Submitted"
              color="default"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              value={todayRedemptions}
              label="Today's Redemptions"
              color="primary"
            />
          </div>

          {/* Add New Code */}
          <div className="card-professional p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Add New Access Code
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="BOOK-2026-XXXX"
                className="font-mono flex-1"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">
                  Max uses:
                </label>
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
              <h2 className="text-lg font-semibold text-foreground">
                Manage Access Codes
              </h2>
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
                    <TableRow
                      key={code.id}
                      className={!code.active ? "opacity-50" : ""}
                    >
                      <TableCell className="font-mono font-medium">
                        {code.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${(code.usesCount / code.maxUses) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {code.usesCount} / {code.maxUses}
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
                        {code.createdAt}
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
              <h2 className="text-lg font-semibold text-foreground">
                Recent Case Submissions
              </h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
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
                  {mockSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {submission.title}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {submission.accessCodeUsed}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(submission.timestamp).toLocaleString()}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
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
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
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
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateCode}>
              Deactivate
            </Button>
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
      <div className="flex items-center gap-4">
        <div className="p-3 bg-muted rounded-lg text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default Admin;
