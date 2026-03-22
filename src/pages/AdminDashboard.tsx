import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  MessageSquare, 
  LogIn, 
  Download, 
  Search, 
  Trash2, 
  Edit2, 
  Key, 
  Activity,
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Stats {
  totalUsers: number;
  totalLogins: number;
  totalFeedbacks: number;
}

interface User {
  _id: string;
  email: string;
  role: string;
  loginCount: number;
  lastLogin: string;
  createdAt: string;
}

interface Feedback {
  _id: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserHealth, setSelectedUserHealth] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleViewHealth = async (userId: string, email: string) => {
    try {
      const result = await api.get(`/api/admin/users/${userId}/health`);
      if (result && result.length > 0) {
        setSelectedUserHealth({ email, ...result[0] });
        toast({ title: "Health Data Loaded", description: `Showing latest analysis for ${email}` });
      } else {
        toast({ title: "No Data", description: "This user hasn't performed any AI analysis yet.", variant: "default" });
      }
    } catch (err: any) {
      toast({ title: "Fetch Failed", description: err.message, variant: "destructive" });
    }
  };

  const fetchData = async () => {
    try {
      const [statsData, usersData, feedbackData] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/users"),
        api.get("/api/admin/feedbacks"),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setFeedbacks(feedbackData);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      if (err.status === 403) navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportUsers = () => {
    const token = localStorage.getItem('admin_token');
    window.open(`${import.meta.env.VITE_API_URL}/api/admin/export/users?token=${token}`, '_blank');
  };

  const handleExportFeedback = () => {
    const token = localStorage.getItem('admin_token');
    window.open(`${import.meta.env.VITE_API_URL}/api/admin/export/feedbacks?token=${token}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("userRole");
    navigate("/admin-login");
  };

  const handleEditUser = async (userId: string, currentEmail: string, currentRole: string) => {
    const newRole = window.prompt(`Change role for ${currentEmail}\n\nCurrent role: ${currentRole}\nEnter new role (user / admin):`, currentRole);
    if (!newRole || newRole === currentRole) return;
    try {
      await api.put(`/api/admin/users/${userId}`, { email: currentEmail, role: newRole });
      toast({ title: "User Updated", description: `Role changed to ${newRole}` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    const newPassword = window.prompt(`Reset password for ${email}\n\nEnter new password (min 6 chars):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: "Too Short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    try {
      await api.patch(`/api/admin/users/${userId}/password`, { password: newPassword });
      toast({ title: "Password Reset", description: `Password updated for ${email}` });
    } catch (err: any) {
      toast({ title: "Reset Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmed = window.confirm(`Are you sure you want to DELETE user:\n${email}\n\nThis action cannot be undone!`);
    if (!confirmed) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast({ title: "User Deleted", description: `${email} has been removed.` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold font-display">Admin Portal</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              Logout
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button variant="outline" size="sm" onClick={handleExportUsers} className="gap-2">
              <Download className="h-4 w-4" /> Export Users
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportFeedback} className="gap-2">
              <Download className="h-4 w-4" /> Export Feedback
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 text-primary">+2 this week</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">System Logins</CardTitle>
              <LogIn className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalLogins || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Global activity count</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalFeedbacks || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Average Rating: 4.8★</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users.</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search email or role..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4 text-center">Logins</th>
                    <th className="pb-3 pr-4">Last Login</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="group">
                      <td className="py-4 pr-4 font-medium">{u.email}</td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-center">{u.loginCount || 0}</td>
                      <td className="py-4 pr-4 text-muted-foreground">
                        {u.lastLogin ? format(new Date(u.lastLogin), "MMM d, HH:mm") : "Never"}
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-4 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleViewHealth(u._id, u.email)} title="View Health Analysis">
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditUser(u._id, u.email, u.role)} title="Edit Role">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleResetPassword(u._id, u.email)} title="Reset Password">
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteUser(u._id, u.email)} title="Delete User">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Health Analysis Display */}
        {selectedUserHealth && (
          <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">AI Health Analysis: {selectedUserHealth.email}</CardTitle>
                <CardDescription>Latest prediction from {format(new Date(selectedUserHealth.timestamp), "PPP p")}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUserHealth(null)}>Close</Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Condition</p>
                  <p className="text-xl font-bold text-primary">{selectedUserHealth.condition}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Severity</p>
                  <p className="text-xl font-bold">{selectedUserHealth.severity}/100</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Risk Level</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    selectedUserHealth.riskLevel === 'high' ? 'bg-destructive/10 text-destructive' : 
                    selectedUserHealth.riskLevel === 'medium' ? 'bg-orange-500/10 text-orange-600' : 
                    'bg-green-500/10 text-green-600'
                  }`}>
                    {selectedUserHealth.riskLevel}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Critical Flags</p>
                  <p className="text-sm font-medium">{selectedUserHealth.criticalFlags?.join(', ') || 'None'}</p>
                </div>
              </div>

              {selectedUserHealth.alerts?.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Active Alerts</p>
                  {selectedUserHealth.alerts.map((a: any, i: number) => (
                    <div key={i} className="text-xs p-2 rounded bg-destructive/10 text-destructive border border-destructive/20">
                      {a.message}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feedback Monitor */}
        <Card>
          <CardHeader>
            <CardTitle>Global Feedback Monitor</CardTitle>
            <CardDescription>Real-time stream of user suggestions and ratings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {feedbacks.map((f) => (
                <Card key={f._id} className="bg-muted/20 border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{f.username}</span>
                      <div className="flex text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Activity key={i} className={`h-3 w-3 ${i < f.rating ? 'fill-current' : 'opacity-20'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80 italic">"{f.comment}"</p>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest border-t pt-2">
                      {format(new Date(f.createdAt), "PPP p")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
