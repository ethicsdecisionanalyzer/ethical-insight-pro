import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  VerificationQuestion,
  UserProfile,
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
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Data state
  const [questions, setQuestions] = useState<VerificationQuestion[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<CaseSubmission[]>([]);
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

  // Check admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) {
        navigate("/");
        return;
      }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [questionsData, profilesData, submissionsData, statsData] = await Promise.all([
        getVerificationQuestions(),
        getAllProfiles(),
        getRecentSubmissions(),
        getAdminStats(),
      ]);
      setQuestions(questionsData);
      setProfiles(profilesData);
      setSubmissions(submissionsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

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
    navigate("/");
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Spinner size="lg" />
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
