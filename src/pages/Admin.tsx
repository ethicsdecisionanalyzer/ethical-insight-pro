import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import {
  Users,
  CheckCircle,
  FileText,
  BookOpen,
  LogOut,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Key,
  Clock,
  Download,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Footer } from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import {
  CaseSubmission,
  getRecentSubmissions,
  getAdminStats,
  getVerificationQuestions,
  createVerificationQuestion,
  updateVerificationQuestion,
  deleteVerificationQuestion,
  getAllProfiles,
  updateUserProfile,
  getAccessCodes,
  toggleAccessCode,
  resetAccessCodeUsage,
  getCodeRedemptionLogs,
  getAllSubmissions,
  computeSummaryMetrics,
  submissionsToCsv,
  VerificationQuestion,
  UserProfile,
  AccessCodeRow,
  CodeRedemptionLog,
  SummaryMetrics,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const [ready, setReady] = useState(false);

  // Inline login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data state
  const [questions, setQuestions] = useState<VerificationQuestion[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<CaseSubmission[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCodeRow[]>([]);
  const [redemptionLogs, setRedemptionLogs] = useState<CodeRedemptionLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    totalSubmissions: 0,
    activeQuestions: 0,
  });

  // Question form
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<VerificationQuestion | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<VerificationQuestion | null>(null);

  // Reset usage dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Metrics + CSV
  const [allSubmissions, setAllSubmissions] = useState<CaseSubmission[]>([]);
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Show login form — no redirect
      setReady(false);
      return;
    }
    if (isAdmin === null) return; // Still loading role
    if (!isAdmin) {
      navigate("/case-intake", { replace: true });
      return;
    }
    setReady(true);
  }, [user, authLoading, isAdmin, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    setLoginLoading(true);
    setLoginError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }
    // AuthContext will pick up the session, set user + isAdmin, and the useEffect above will set ready=true
    setLoginLoading(false);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getVerificationQuestions(),
      getAllProfiles(),
      getRecentSubmissions(),
      getAdminStats(),
      getAccessCodes(),
      getCodeRedemptionLogs(),
      getAllSubmissions(),
    ]);
    if (results[0].status === "fulfilled") setQuestions(results[0].value);
    if (results[1].status === "fulfilled") setProfiles(results[1].value);
    if (results[2].status === "fulfilled") setSubmissions(results[2].value);
    if (results[3].status === "fulfilled") setStats(results[3].value);
    if (results[4].status === "fulfilled") setAccessCodes(results[4].value);
    if (results[5].status === "fulfilled") setRedemptionLogs(results[5].value);
    if (results[6].status === "fulfilled") {
      const allSubs = results[6].value;
      setAllSubmissions(allSubs);
      const logs = results[5].status === "fulfilled" ? results[5].value : [];
      setMetrics(computeSummaryMetrics(allSubs, logs));
    }
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      failures.forEach((f) => console.error("Dashboard load error:", (f as PromiseRejectedResult).reason));
      if (failures.length === results.length) {
        toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) loadData();
  }, [ready, loadData]);

  // Question CRUD
  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionText("");
    setAnswerText("");
    setShowQuestionDialog(true);
  };

  const openEditQuestion = (q: VerificationQuestion) => {
    setEditingQuestion(q);
    setQuestionText(q.question);
    setAnswerText(q.answer);
    setShowQuestionDialog(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim() || !answerText.trim()) return;
    setSavingQuestion(true);
    try {
      if (editingQuestion) {
        await updateVerificationQuestion(editingQuestion.id, { question: questionText, answer: answerText });
        toast({ title: "Updated", description: "Verification question updated." });
      } else {
        await createVerificationQuestion(questionText, answerText);
        toast({ title: "Created", description: "Verification question added." });
      }
      setShowQuestionDialog(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save question.", variant: "destructive" });
    }
    setSavingQuestion(false);
  };

  const handleToggleQuestion = async (q: VerificationQuestion) => {
    try {
      await updateVerificationQuestion(q.id, { active: !q.active });
      await loadData();
      toast({ title: "Updated", description: `Question ${q.active ? "deactivated" : "activated"}.` });
    } catch {
      toast({ title: "Error", description: "Failed to toggle question.", variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    try {
      await deleteVerificationQuestion(deletingQuestion.id);
      await loadData();
      toast({ title: "Deleted", description: "Verification question removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete question.", variant: "destructive" });
    }
    setShowDeleteDialog(false);
    setDeletingQuestion(null);
  };

  // Access code management
  const handleToggleCode = async (code: AccessCodeRow) => {
    try {
      await toggleAccessCode(code.id, !code.active);
      await loadData();
      toast({ title: "Updated", description: `Code ${code.active ? "deactivated" : "activated"}.` });
    } catch {
      toast({ title: "Error", description: "Failed to toggle access code.", variant: "destructive" });
    }
  };

  const handleResetCodeUsage = async (code: AccessCodeRow) => {
    try {
      await resetAccessCodeUsage(code.id);
      await loadData();
      toast({ title: "Reset", description: `Usage count reset for ${code.code}.` });
    } catch {
      toast({ title: "Error", description: "Failed to reset code usage.", variant: "destructive" });
    }
  };

  // CSV Export
  const handleCsvExport = () => {
    const csv = submissionsToCsv(allSubmissions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ethical-insight-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "CSV Exported", description: `${allSubmissions.length} records exported.` });
  };

  // Metrics date filtering
  const handleMetricsFilter = async () => {
    try {
      const subs = await getAllSubmissions(dateFrom || undefined, dateTo || undefined);
      setAllSubmissions(subs);
      setMetrics(computeSummaryMetrics(subs, redemptionLogs));
    } catch {
      toast({ title: "Error", description: "Failed to filter data.", variant: "destructive" });
    }
  };

  // User management
  const handleResetUsage = async () => {
    if (!selectedUser) return;
    try {
      await updateUserProfile(selectedUser.user_id, { usage_count: 0 });
      await loadData();
      toast({ title: "Reset", description: `Usage count reset for ${selectedUser.full_name}.` });
    } catch {
      toast({ title: "Error", description: "Failed to reset usage.", variant: "destructive" });
    }
    setShowResetDialog(false);
    setSelectedUser(null);
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show inline login form if not authenticated or not admin yet
  if (!user || !ready) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light">
        <header className="bg-card border-b border-border py-4">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="card-professional-elevated p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Admin Sign In</h2>
                <p className="text-muted-foreground text-sm">
                  Sign in with your administrator credentials.
                </p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@email.com"
                    className="input-professional"
                    required
                    disabled={loginLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your password"
                    className="input-professional"
                    required
                    disabled={loginLoading}
                  />
                </div>
                {loginError && (
                  <div className="alert-error flex items-start gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}
                <Button type="submit" disabled={loginLoading || !loginEmail.trim() || !loginPassword.trim()} className="w-full h-12 text-base font-medium">
                  {loginLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
                <StatCard icon={<Users className="w-6 h-6" />} value={stats.totalUsers} label="Total Users" color="default" />
                <StatCard icon={<CheckCircle className="w-6 h-6" />} value={stats.verifiedUsers} label="Verified Users" color="success" />
                <StatCard icon={<FileText className="w-6 h-6" />} value={stats.totalSubmissions} label="Cases Submitted" color="default" />
                <StatCard icon={<BookOpen className="w-6 h-6" />} value={stats.activeQuestions} label="Active Questions" color="primary" />
              </div>

              <Tabs defaultValue="questions" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="questions">Verification Questions</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="submissions">Submissions</TabsTrigger>
                  <TabsTrigger value="codes">Access Codes</TabsTrigger>
                  <TabsTrigger value="logs">Usage Logs</TabsTrigger>
                  <TabsTrigger value="metrics">Summary Metrics</TabsTrigger>
                  <TabsTrigger value="export">CSV Export</TabsTrigger>
                </TabsList>

                {/* Verification Questions Tab */}
                <TabsContent value="questions">
                  <div className="card-professional p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-foreground">Verification Questions</h2>
                      <Button onClick={openAddQuestion} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Question
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead>Answer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {questions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No verification questions yet. Add one to enable book verification.
                              </TableCell>
                            </TableRow>
                          ) : (
                            questions.map((q) => (
                              <TableRow key={q.id} className={!q.active ? "opacity-50" : ""}>
                                <TableCell className="max-w-[300px]">{q.question}</TableCell>
                                <TableCell className="font-mono text-sm">{q.answer}</TableCell>
                                <TableCell>
                                  {q.active ? (
                                    <span className="badge-success">Active</span>
                                  ) : (
                                    <span className="badge-neutral">Inactive</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => openEditQuestion(q)} title="Edit">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleQuestion(q)} title={q.active ? "Deactivate" : "Activate"}>
                                      {q.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setDeletingQuestion(q); setShowDeleteDialog(true); }} title="Delete">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users">
                  <div className="card-professional p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Registered Users</h2>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Profession</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profiles.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No registered users yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            profiles.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.full_name}</TableCell>
                                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                                <TableCell className="text-muted-foreground">{p.profession || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${(p.usage_count / p.max_analyses) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {p.usage_count}/{p.max_analyses}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {p.book_verified ? (
                                    <span className="badge-success">Yes</span>
                                  ) : (
                                    <span className="badge-neutral">No</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedUser(p); setShowResetDialog(true); }}
                                    title="Reset usage"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Submissions Tab */}
                <TabsContent value="submissions">
                  <div className="card-professional p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Recent Case Submissions</h2>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Case Title</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                No submissions yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            submissions.map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell className="font-medium max-w-[300px] truncate">
                                  {submission.title}
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
                </TabsContent>
                {/* Access Codes Tab */}
                <TabsContent value="codes">
                  <div className="card-professional p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Access Codes
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accessCodes.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No access codes found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            accessCodes.map((code) => (
                              <TableRow key={code.id} className={!code.active ? "opacity-50" : ""}>
                                <TableCell className="font-mono text-sm">{code.code}</TableCell>
                                <TableCell>
                                  {code.active ? (
                                    <span className="badge-success">Active</span>
                                  ) : (
                                    <span className="badge-neutral">Inactive</span>
                                  )}
                                </TableCell>
                                <TableCell>{code.uses_count} / {code.max_uses}</TableCell>
                                <TableCell>{Math.max(0, code.max_uses - code.uses_count)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {new Date(code.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleCode(code)} title={code.active ? "Deactivate" : "Activate"}>
                                      {code.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleResetCodeUsage(code)} title="Reset usage">
                                      <RotateCcw className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Usage Logs Tab */}
                <TabsContent value="logs">
                  <div className="card-professional p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Code Redemption Logs
                    </h2>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead>User ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {redemptionLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No redemption logs yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            redemptionLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="text-muted-foreground">
                                  {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-mono text-sm">{log.code}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">{log.session_id}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{log.user_id || "N/A"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Summary Metrics Tab */}
                <TabsContent value="metrics">
                  <div className="card-professional p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Summary Metrics
                    </h2>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">From:</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">To:</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
                      </div>
                      <Button variant="outline" size="sm" onClick={handleMetricsFilter}>Apply Filter</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); loadData(); }}>Clear</Button>
                    </div>
                    {metrics && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold">{metrics.totalSubmissions}</p>
                            <p className="text-sm text-muted-foreground">Total Submissions</p>
                          </div>
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{metrics.stabilityDistribution.stable}</p>
                            <p className="text-sm text-muted-foreground">Ethically Stable</p>
                          </div>
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-600">{metrics.stabilityDistribution.contested}</p>
                            <p className="text-sm text-muted-foreground">Ethically Contested</p>
                          </div>
                          <div className="border rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-red-600">{metrics.stabilityDistribution.unstable}</p>
                            <p className="text-sm text-muted-foreground">Ethically Unstable</p>
                          </div>
                        </div>
                        <h3 className="font-semibold mb-2">Violation Frequency by Professional Code</h3>
                        <div className="overflow-x-auto mb-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Professional Code</TableHead>
                                <TableHead>Violations</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.keys(metrics.violationsByCode).length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center text-muted-foreground py-4">No violations recorded.</TableCell>
                                </TableRow>
                              ) : (
                                Object.entries(metrics.violationsByCode).map(([code, count]) => (
                                  <TableRow key={code}>
                                    <TableCell className="font-medium">{code}</TableCell>
                                    <TableCell>{count}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        <h3 className="font-semibold mb-2">Access Code Redemption Counts</h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Access Code</TableHead>
                                <TableHead>Redemptions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.keys(metrics.accessCodeRedemptions).length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center text-muted-foreground py-4">No redemptions recorded.</TableCell>
                                </TableRow>
                              ) : (
                                Object.entries(metrics.accessCodeRedemptions).map(([code, count]) => (
                                  <TableRow key={code}>
                                    <TableCell className="font-mono text-sm">{code}</TableCell>
                                    <TableCell>{count}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* CSV Export Tab */}
                <TabsContent value="export">
                  <div className="card-professional p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      CSV Export
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export all case submissions with analysis data as a CSV file. Includes: Case ID, Timestamp, Professional Codes, all six lens scores, Composite Score, Stability, Violation details, Conflict Level, and Algorithm Version.
                    </p>
                    <div className="flex items-center gap-4 mb-6">
                      <Button onClick={handleCsvExport} disabled={allSubmissions.length === 0} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export {allSubmissions.length} Record{allSubmissions.length !== 1 ? "s" : ""} to CSV
                      </Button>
                    </div>
                    <h3 className="font-semibold mb-2">CSV Columns</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            ["Case ID", "Unique submission identifier"],
                            ["Timestamp", "Submission date/time"],
                            ["Title", "Case title"],
                            ["Professional Codes", "Selected professional codes (semicolon-separated)"],
                            ["Utilitarian", "Utilitarian lens score (1-10)"],
                            ["Duty", "Deontological / Duty lens score (1-10)"],
                            ["Justice", "Justice / Fairness lens score (1-10)"],
                            ["Virtue", "Virtue lens score (1-10)"],
                            ["Care", "Care lens score (1-10)"],
                            ["Common Good", "Common Good lens score (1-10)"],
                            ["Composite Score", "Weighted composite (70% code + 30% lens)"],
                            ["Stability", "Ethically Stable / Contested / Unstable"],
                            ["Violation", "Yes / No"],
                            ["Violation Severity", "none / single_violation / multi_violation"],
                            ["Violated Codes", "Which professional codes were violated"],
                            ["Conflict Level", "1-6 conflict severity"],
                            ["Algorithm Version", "Version of the analysis algorithm"],
                          ].map(([col, desc]) => (
                            <TableRow key={col}>
                              <TableCell className="font-mono text-sm">{col}</TableCell>
                              <TableCell className="text-muted-foreground">{desc}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

              </Tabs>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Add/Edit Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit" : "Add"} Verification Question</DialogTitle>
            <DialogDescription>
              This question will be shown to users during book verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Question</label>
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g., What is the title of Chapter 3?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Expected Answer</label>
              <Input
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="The exact answer (case-insensitive match)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} disabled={!questionText.trim() || !answerText.trim() || savingQuestion}>
              {savingQuestion ? <Spinner size="sm" /> : editingQuestion ? "Update" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question?</DialogTitle>
            <DialogDescription>
              This will permanently remove this verification question.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteQuestion}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Usage Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Usage Count?</DialogTitle>
            <DialogDescription>
              Reset usage for <span className="font-medium">{selectedUser?.full_name}</span>? This will set their analysis count back to 0.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button onClick={handleResetUsage}>Reset</Button>
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
