import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";

const EMPTY_STUDENT = { studentId: "", fullName: "", email: "", phone: "" };
const EMPTY_CLASS = { name: "", schedule: "", room: "", assignedProfessor: "" };
const EMPTY_ADMIN = { fullName: "", email: "", password: "" };
const EMPTY_ENROLL = { student: "", classRef: "" };

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("sis_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("sis_user");
    return raw ? JSON.parse(raw) : null;
  });

  const saveSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("sis_token", nextToken);
    localStorage.setItem("sis_user", JSON.stringify(nextUser));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("sis_token");
    localStorage.removeItem("sis_user");
  };

  return { token, user, saveSession, logout };
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = await apiRequest("/auth/login", { method: "POST", body: { email, password } });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h1>Student Information System</h1>
        <p className="muted">Role-based access for Super Admin and Professors</p>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function PageCard({ title, subtitle, children }) {
  return (
    <section className="card page-card">
      <div className="page-card-head">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function App() {
  const { token, user, saveSession, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  const [studentForm, setStudentForm] = useState(EMPTY_STUDENT);
  const [classForm, setClassForm] = useState(EMPTY_CLASS);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN);
  const [enrollForm, setEnrollForm] = useState(EMPTY_ENROLL);
  const [studentEditForm, setStudentEditForm] = useState({ id: "", fullName: "", email: "", phone: "" });
  const [enrollEditForm, setEnrollEditForm] = useState({ id: "", grade: "", attendance: "", notes: "" });
  const [editingEnrollmentId, setEditingEnrollmentId] = useState(null);
  const [classFilter, setClassFilter] = useState("all");
  const [expelForm, setExpelForm] = useState({ studentId: "" });
  const [studentTransferForm, setStudentTransferForm] = useState({
    studentId: "",
    fromClassId: "",
    toClassId: ""
  });
  const [fireProfessorForm, setFireProfessorForm] = useState({ professorId: "", replacementProfessorId: "" });
  const [transferProfessorForm, setTransferProfessorForm] = useState({ classId: "", toProfessorId: "" });
  const [modal, setModal] = useState({ type: "" });
  const [studentSearch, setStudentSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [professorSearch, setProfessorSearch] = useState("");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");

  const isSuperAdmin = user?.role === "superadmin";
  const classOptions = useMemo(() => classes.map((c) => ({ value: c._id, label: c.name })), [classes]);
  const sourceClassOptions = useMemo(() => {
    if (!studentTransferForm.studentId) return [];
    return enrollments
      .filter((e) => e.student?._id === studentTransferForm.studentId && e.classRef?._id)
      .map((e) => ({ value: e.classRef._id, label: e.classRef.name }));
  }, [studentTransferForm.studentId, enrollments]);
  const palette = ["#2563eb", "#7c3aed", "#059669", "#ea580c", "#db2777", "#0f766e", "#4f46e5"];

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredClasses = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.schedule?.toLowerCase().includes(q) ||
        c.assignedProfessor?.fullName?.toLowerCase().includes(q)
    );
  }, [classes, classSearch]);

  const filteredAdmins = useMemo(() => {
    const q = professorSearch.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => a.fullName?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q));
  }, [admins, professorSearch]);

  const filteredEnrollments = useMemo(() => {
    const q = enrollmentSearch.trim().toLowerCase();
    if (!q) return enrollments;
    return enrollments.filter(
      (e) =>
        e.student?.fullName?.toLowerCase().includes(q) ||
        e.classRef?.name?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
    );
  }, [enrollments, enrollmentSearch]);

  const enrollmentByClass = useMemo(() => {
    const counts = {};
    enrollments.forEach((e) => {
      const key = e.classRef?.name || "Unassigned";
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = Object.values(counts).reduce((acc, value) => acc + value, 0);
    if (!total) return { gradient: "#cbd5e1", items: [] };

    let cursor = 0;
    const items = Object.entries(counts).map(([name, count], index) => {
      const pct = (count / total) * 100;
      const start = cursor;
      const end = cursor + pct;
      cursor = end;
      return { name, count, pct, color: palette[index % palette.length], start, end };
    });
    const gradient = items.map((i) => `${i.color} ${i.start}% ${i.end}%`).join(", ");
    return { gradient: `conic-gradient(${gradient})`, items };
  }, [enrollments]);

  const navItems = isSuperAdmin
    ? ["dashboard", "students", "classes", "professors", "enrollments"]
    : ["dashboard", "students", "classes", "enrollments"];

  const loadAll = async () => {
    if (!token || !user) return;
    try {
      const [studentsData, classesData, enrollData] = await Promise.all([
        apiRequest("/students", { token }),
        apiRequest("/classes", { token }),
        apiRequest("/enrollments", { token })
      ]);

      setStudents(studentsData);
      setClasses(classesData);
      setEnrollments(enrollData);

      if (isSuperAdmin) {
        const [adminsData, reportData] = await Promise.all([
          apiRequest("/users", { token }),
          apiRequest("/reports/system", { token })
        ]);
        setAdmins(adminsData);
        setReport(reportData);
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, [token, user?.role]);

  const runAction = async (action, successMessage) => {
    try {
      await action();
      setMessage(successMessage);
      await loadAll();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const createStudent = async (event) => {
    event.preventDefault();
    await runAction(() => apiRequest("/students", { method: "POST", token, body: studentForm }), "Student created");
    setStudentSearch("");
    setActivePage("students");
    setStudentForm(EMPTY_STUDENT);
  };

  const createClass = async (event) => {
    event.preventDefault();
    await runAction(() => apiRequest("/classes", { method: "POST", token, body: classForm }), "Class created");
    setClassSearch("");
    setActivePage("classes");
    setClassForm(EMPTY_CLASS);
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    await runAction(() => apiRequest("/users", { method: "POST", token, body: adminForm }), "Professor account created");
    setProfessorSearch("");
    setActivePage("professors");
    setAdminForm(EMPTY_ADMIN);
  };

  const createEnrollment = async (event) => {
    event.preventDefault();
    await runAction(
      () => apiRequest("/enrollments", { method: "POST", token, body: enrollForm }),
      "Student assigned to class"
    );
    setEnrollForm(EMPTY_ENROLL);
  };

  const updateStudent = async (event) => {
    event.preventDefault();
    if (!studentEditForm.id) return;
    await runAction(
      () =>
        apiRequest(`/students/${studentEditForm.id}`, {
          method: "PATCH",
          token,
          body: {
            fullName: studentEditForm.fullName || undefined,
            email: studentEditForm.email || undefined,
            phone: studentEditForm.phone || undefined
          }
        }),
      "Student updated"
    );
  };

  const startEditEnrollment = (enrollment) => {
    setEditingEnrollmentId(enrollment._id);
    setEnrollEditForm({
      id: enrollment._id,
      grade: enrollment.grade || "",
      attendance: enrollment.attendance ?? "",
      notes: enrollment.notes || ""
    });
  };

  const cancelEditEnrollment = () => {
    setEditingEnrollmentId(null);
    setEnrollEditForm({ id: "", grade: "", attendance: "", notes: "" });
  };

  const updateEnrollment = async (event) => {
    event.preventDefault();
    if (!enrollEditForm.id) return;
    await runAction(
      () =>
        apiRequest(`/enrollments/${enrollEditForm.id}`, {
          method: "PATCH",
          token,
          body: {
            grade: enrollEditForm.grade,
            attendance: Number(enrollEditForm.attendance),
            notes: enrollEditForm.notes
          }
        }),
      "Enrollment updated"
    );
    setEditingEnrollmentId(null);
    setEnrollEditForm({ id: "", grade: "", attendance: "", notes: "" });
  };

  const professorClassTabs = useMemo(() => {
    if (isSuperAdmin) return [];
    const classMap = {};
    enrollments.forEach((e) => {
      if (e.classRef?._id && !classMap[e.classRef._id]) {
        classMap[e.classRef._id] = e.classRef.name;
      }
    });
    return Object.entries(classMap).map(([id, name]) => ({ id, name }));
  }, [enrollments, isSuperAdmin]);

  const professorFilteredEnrollments = useMemo(() => {
    let list = enrollments;
    if (classFilter !== "all") {
      list = list.filter((e) => e.classRef?._id === classFilter);
    }
    const q = enrollmentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.student?.fullName?.toLowerCase().includes(q) ||
          e.classRef?.name?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enrollments, classFilter, enrollmentSearch]);

  const expelStudent = async (event) => {
    event.preventDefault();
    if (!expelForm.studentId) return;
    await runAction(
      () => apiRequest(`/students/${expelForm.studentId}/expel`, { method: "POST", token }),
      "Student expelled successfully"
    );
    setExpelForm({ studentId: "" });
  };

  const openStudentTransferModal = (studentId) => {
    setStudentTransferForm({ studentId, fromClassId: "", toClassId: "" });
    setModal({ type: "transferStudent" });
  };

  const openStudentExpelModal = (studentId) => {
    setExpelForm({ studentId });
    setModal({ type: "expelStudent" });
  };

  const openProfessorTransferModal = (classId, toProfessorId = "") => {
    setTransferProfessorForm({ classId, toProfessorId });
    setModal({ type: "transferProfessor" });
  };

  const openProfessorFireModal = (professorId) => {
    setFireProfessorForm({ professorId, replacementProfessorId: "" });
    setModal({ type: "fireProfessor" });
  };

  const transferStudent = async (event) => {
    event.preventDefault();
    if (!studentTransferForm.studentId) return;
    await runAction(
      () =>
        apiRequest(`/students/${studentTransferForm.studentId}/transfer`, {
          method: "POST",
          token,
          body: {
            fromClassId: studentTransferForm.fromClassId,
            toClassId: studentTransferForm.toClassId
          }
        }),
      "Student transferred successfully"
    );
    setStudentTransferForm({ studentId: "", fromClassId: "", toClassId: "" });
  };

  const fireProfessor = async (event) => {
    event.preventDefault();
    if (!fireProfessorForm.professorId) return;
    await runAction(
      () =>
        apiRequest(`/users/${fireProfessorForm.professorId}/fire`, {
          method: "POST",
          token,
          body: { replacementProfessorId: fireProfessorForm.replacementProfessorId || undefined }
        }),
      "Professor fired successfully"
    );
    setFireProfessorForm({ professorId: "", replacementProfessorId: "" });
  };

  const transferProfessor = async (event) => {
    event.preventDefault();
    await runAction(
      () =>
        apiRequest("/users/transfer-professor", {
          method: "POST",
          token,
          body: transferProfessorForm
        }),
      "Professor transferred successfully"
    );
    setTransferProfessorForm({ classId: "", toProfessorId: "" });
  };

  if (!token || !user) return <Login onLogin={saveSession} />;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <h2>SIS</h2>
          <p className="role-label">{isSuperAdmin ? "Super Admin" : "Professor Admin"}</p>
          <p className="muted">{user.fullName}</p>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item}
              className={`nav-btn ${activePage === item ? "active" : ""}`}
              onClick={() => setActivePage(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h1>
          {message && <p className="status">{message}</p>}
        </header>

        {activePage === "dashboard" && (
          <section className="stack">
            {isSuperAdmin && report ? (
              <>
                <div className="stats">
                  <div className="card stat"><strong>{report.totalStudents}</strong><span>Students</span></div>
                  <div className="card stat"><strong>{report.totalClasses}</strong><span>Classes</span></div>
                  <div className="card stat"><strong>{report.totalAdmins}</strong><span>Professors</span></div>
                  <div className="card stat"><strong>{report.totalEnrollments}</strong><span>Enrollments</span></div>
                </div>
                <PageCard title="Enrollment Wheel" subtitle="Distribution of enrolled students by class.">
                  <div className="wheel-wrap">
                    <div className="wheel" style={{ background: enrollmentByClass.gradient }} />
                    <div className="wheel-legend">
                      {enrollmentByClass.items.map((item) => (
                        <div key={item.name} className="legend-row">
                          <span className="legend-dot" style={{ background: item.color }} />
                          <span>{item.name}</span>
                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </PageCard>
              </>
            ) : (
              <PageCard title="Welcome" subtitle="Quick overview of your classes and students.">
                <p className="muted">
                  Use the sidebar to move between separate pages for student records, classes, and enrollment updates.
                </p>
              </PageCard>
            )}
          </section>
        )}

        {activePage === "students" && (
          <section className="stack">
            {isSuperAdmin ? (
              <PageCard title="Add Student" subtitle="Create a new student record in the system.">
                <form className="form-grid" onSubmit={createStudent}>
                  <input
                    placeholder="Student ID"
                    value={studentForm.studentId}
                    onChange={(e) => setStudentForm((v) => ({ ...v, studentId: e.target.value }))}
                    required
                  />
                  <input
                    placeholder="Full name"
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm((v) => ({ ...v, fullName: e.target.value }))}
                    required
                  />
                  <input
                    placeholder="Email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm((v) => ({ ...v, email: e.target.value }))}
                  />
                  <input
                    placeholder="Phone"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm((v) => ({ ...v, phone: e.target.value }))}
                  />
                  <button type="submit">Save Student</button>
                </form>
              </PageCard>
            ) : (
              <PageCard title="Edit Student Basic Info" subtitle="Update student details from your assigned classes only.">
                <form className="form-grid" onSubmit={updateStudent}>
                  <select
                    value={studentEditForm.id}
                    onChange={(e) => setStudentEditForm((v) => ({ ...v, id: e.target.value }))}
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="New full name"
                    value={studentEditForm.fullName}
                    onChange={(e) => setStudentEditForm((v) => ({ ...v, fullName: e.target.value }))}
                  />
                  <input
                    placeholder="New email"
                    value={studentEditForm.email}
                    onChange={(e) => setStudentEditForm((v) => ({ ...v, email: e.target.value }))}
                  />
                  <input
                    placeholder="New phone"
                    value={studentEditForm.phone}
                    onChange={(e) => setStudentEditForm((v) => ({ ...v, phone: e.target.value }))}
                  />
                  <button type="submit">Update Student</button>
                </form>
              </PageCard>
            )}

            <PageCard title="Student List">
              <div className="table-tools">
                <input
                  placeholder="Search student by id, name, or email"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th>{isSuperAdmin && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s._id}>
                      <td>{s.studentId}</td>
                      <td>{s.fullName}</td>
                      <td>{s.email || "-"}</td>
                      {isSuperAdmin && (
                        <td className="row-actions">
                          <button onClick={() => openStudentTransferModal(s._id)}>Transfer</button>
                          <button className="danger-btn" onClick={() => openStudentExpelModal(s._id)}>Expel</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </PageCard>
          </section>
        )}

        {activePage === "classes" && (
          <section className="stack">
            {isSuperAdmin && (
              <PageCard title="Add Class" subtitle="Create a class and assign a professor.">
                <form className="form-grid" onSubmit={createClass}>
                  <input
                    placeholder="Class name"
                    value={classForm.name}
                    onChange={(e) => setClassForm((v) => ({ ...v, name: e.target.value }))}
                    required
                  />
                  <input
                    placeholder="Schedule"
                    value={classForm.schedule}
                    onChange={(e) => setClassForm((v) => ({ ...v, schedule: e.target.value }))}
                  />
                  <input
                    placeholder="Room"
                    value={classForm.room}
                    onChange={(e) => setClassForm((v) => ({ ...v, room: e.target.value }))}
                  />
                  <select
                    value={classForm.assignedProfessor}
                    onChange={(e) => setClassForm((v) => ({ ...v, assignedProfessor: e.target.value }))}
                  >
                    <option value="">Assign professor</option>
                    {admins.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>
                  <button type="submit">Save Class</button>
                </form>
              </PageCard>
            )}

            <PageCard title={isSuperAdmin ? "All Classes" : "My Classes"}>
              <div className="table-tools">
                <input
                  placeholder="Search class by name, schedule, or professor"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                />
              </div>
              <table>
                <thead><tr><th>Name</th><th>Schedule</th><th>Professor</th>{isSuperAdmin && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filteredClasses.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>{c.schedule || "-"}</td>
                      <td>{c.assignedProfessor?.fullName || "-"}</td>
                      {isSuperAdmin && (
                        <td className="row-actions">
                          <button onClick={() => openProfessorTransferModal(c._id)}>Transfer Prof</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </PageCard>
          </section>
        )}

        {activePage === "professors" && isSuperAdmin && (
          <section className="stack">
            <PageCard title="Add Professor Account" subtitle="Create admin/professor login credentials.">
              <form className="form-grid" onSubmit={createAdmin}>
                <input
                  placeholder="Full name"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm((v) => ({ ...v, fullName: e.target.value }))}
                  required
                />
                <input
                  placeholder="Email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm((v) => ({ ...v, email: e.target.value }))}
                  required
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((v) => ({ ...v, password: e.target.value }))}
                  required
                />
                <button type="submit">Save Professor</button>
              </form>
            </PageCard>

            <PageCard title="Professor Accounts">
              <div className="table-tools">
                <input
                  placeholder="Search professor by name or email"
                  value={professorSearch}
                  onChange={(e) => setProfessorSearch(e.target.value)}
                />
              </div>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Assigned Classes</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredAdmins.map((a) => (
                    <tr key={a._id}>
                      <td>{a.fullName}</td>
                      <td>{a.email}</td>
                      <td>{(a.assignedClasses || []).map((x) => x.name).join(", ") || "-"}</td>
                      <td className="row-actions">
                        <button
                          onClick={() => openProfessorTransferModal("", a._id)}
                        >
                          Assign Class
                        </button>
                        <button className="danger-btn" onClick={() => openProfessorFireModal(a._id)}>Fire</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PageCard>
          </section>
        )}

        {activePage === "enrollments" && (
          <section className="stack">
            {isSuperAdmin ? (
              <PageCard title="Assign Student to Class">
                <form className="form-grid" onSubmit={createEnrollment}>
                  <select
                    value={enrollForm.student}
                    onChange={(e) => setEnrollForm((v) => ({ ...v, student: e.target.value }))}
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={enrollForm.classRef}
                    onChange={(e) => setEnrollForm((v) => ({ ...v, classRef: e.target.value }))}
                    required
                  >
                    <option value="">Select class</option>
                    {classOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit">Assign</button>
                </form>
              </PageCard>
            ) : (
              <PageCard title="Class Records" subtitle="Manage grades, attendance, and notes for your students.">
                {professorClassTabs.length > 1 && (
                  <div className="class-tabs">
                    <button
                      className={`class-tab ${classFilter === "all" ? "active" : ""}`}
                      onClick={() => setClassFilter("all")}
                    >
                      All Classes
                    </button>
                    {professorClassTabs.map((ct) => (
                      <button
                        key={ct.id}
                        className={`class-tab ${classFilter === ct.id ? "active" : ""}`}
                        onClick={() => setClassFilter(ct.id)}
                      >
                        {ct.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="table-tools">
                  <input
                    placeholder="Search by student name, class, or notes…"
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                  />
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Grade</th>
                      <th>Attendance</th>
                      <th>Notes</th>
                      <th style={{ width: "130px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professorFilteredEnrollments.map((e) => (
                      <tr key={e._id} className={editingEnrollmentId === e._id ? "editing-row" : ""}>
                        <td>{e.student?.fullName || "-"}</td>
                        <td>{e.classRef?.name || "-"}</td>
                        {editingEnrollmentId === e._id ? (
                          <>
                            <td>
                              <input
                                className="inline-input"
                                placeholder="Grade"
                                value={enrollEditForm.grade}
                                onChange={(ev) => setEnrollEditForm((v) => ({ ...v, grade: ev.target.value }))}
                              />
                            </td>
                            <td>
                              <input
                                className="inline-input"
                                placeholder="%"
                                type="number"
                                min="0"
                                max="100"
                                value={enrollEditForm.attendance}
                                onChange={(ev) => setEnrollEditForm((v) => ({ ...v, attendance: ev.target.value }))}
                              />
                            </td>
                            <td>
                              <input
                                className="inline-input"
                                placeholder="Notes"
                                value={enrollEditForm.notes}
                                onChange={(ev) => setEnrollEditForm((v) => ({ ...v, notes: ev.target.value }))}
                              />
                            </td>
                            <td className="row-actions">
                              <button className="save-btn" onClick={updateEnrollment}>Save</button>
                              <button className="cancel-btn" onClick={cancelEditEnrollment}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td><span className={`grade-badge ${e.grade ? "" : "empty"}`}>{e.grade || "—"}</span></td>
                            <td>
                              <div className="attendance-cell">
                                <div className="attendance-bar">
                                  <div className="attendance-fill" style={{ width: `${e.attendance || 0}%` }} />
                                </div>
                                <span>{e.attendance ?? 0}%</span>
                              </div>
                            </td>
                            <td className="notes-cell">{e.notes || "—"}</td>
                            <td className="row-actions">
                              <button onClick={() => startEditEnrollment(e)}>Edit</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {professorFilteredEnrollments.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>No enrollments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </PageCard>
            )}

            {isSuperAdmin && (
            <PageCard title="Enrollment List">
              <div className="table-tools">
                <input
                  placeholder="Search enrollment by student, class, or notes"
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                />
              </div>
              <table>
                <thead><tr><th>Student</th><th>Class</th><th>Grade</th><th>Attendance</th><th>Notes</th></tr></thead>
                <tbody>
                  {filteredEnrollments.map((e) => (
                    <tr key={e._id}>
                      <td>{e.student?.fullName || "-"}</td>
                      <td>{e.classRef?.name || "-"}</td>
                      <td>{e.grade || "-"}</td>
                      <td>{e.attendance}%</td>
                      <td>{e.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PageCard>
            )}
          </section>
        )}
      </main>
      {modal.type && (
        <div className="modal-overlay" onClick={() => setModal({ type: "" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {modal.type === "transferStudent" && (
              <>
                <h3>Transfer Student</h3>
                <form className="form-grid" onSubmit={async (e) => { await transferStudent(e); setModal({ type: "" }); }}>
                  <select
                    value={studentTransferForm.studentId}
                    onChange={(e) =>
                      setStudentTransferForm({ studentId: e.target.value, fromClassId: "", toClassId: "" })
                    }
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                  </select>
                  <select
                    value={studentTransferForm.fromClassId}
                    onChange={(e) => setStudentTransferForm((v) => ({ ...v, fromClassId: e.target.value }))}
                    required
                  >
                    <option value="">From class</option>
                    {sourceClassOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <select
                    value={studentTransferForm.toClassId}
                    onChange={(e) => setStudentTransferForm((v) => ({ ...v, toClassId: e.target.value }))}
                    required
                  >
                    <option value="">To class</option>
                    {classOptions
                      .filter((c) => c.value !== studentTransferForm.fromClassId)
                      .map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <button type="submit">Transfer Student</button>
                </form>
              </>
            )}
            {modal.type === "expelStudent" && (
              <>
                <h3>Expel Student</h3>
                <form className="form-grid" onSubmit={async (e) => { await expelStudent(e); setModal({ type: "" }); }}>
                  <select
                    value={expelForm.studentId}
                    onChange={(e) => setExpelForm({ studentId: e.target.value })}
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                  </select>
                  <button type="submit" className="danger-btn">Expel Student</button>
                </form>
              </>
            )}
            {modal.type === "transferProfessor" && (
              <>
                <h3>Transfer Professor</h3>
                <form className="form-grid" onSubmit={async (e) => { await transferProfessor(e); setModal({ type: "" }); }}>
                  <select
                    value={transferProfessorForm.classId}
                    onChange={(e) => setTransferProfessorForm((v) => ({ ...v, classId: e.target.value }))}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <select
                    value={transferProfessorForm.toProfessorId}
                    onChange={(e) => setTransferProfessorForm((v) => ({ ...v, toProfessorId: e.target.value }))}
                    required
                  >
                    <option value="">Transfer to professor</option>
                    {admins.map((a) => <option key={a._id} value={a._id}>{a.fullName}</option>)}
                  </select>
                  <button type="submit">Transfer Professor</button>
                </form>
              </>
            )}
            {modal.type === "fireProfessor" && (
              <>
                <h3>Fire Professor</h3>
                <form className="form-grid" onSubmit={async (e) => { await fireProfessor(e); setModal({ type: "" }); }}>
                  <select
                    value={fireProfessorForm.professorId}
                    onChange={(e) => setFireProfessorForm((v) => ({ ...v, professorId: e.target.value }))}
                    required
                  >
                    <option value="">Select professor</option>
                    {admins.map((a) => <option key={a._id} value={a._id}>{a.fullName}</option>)}
                  </select>
                  <select
                    value={fireProfessorForm.replacementProfessorId}
                    onChange={(e) => setFireProfessorForm((v) => ({ ...v, replacementProfessorId: e.target.value }))}
                  >
                    <option value="">Optional class transfer target</option>
                    {admins.filter((a) => a._id !== fireProfessorForm.professorId).map((a) => (
                      <option key={a._id} value={a._id}>{a.fullName}</option>
                    ))}
                  </select>
                  <button type="submit" className="danger-btn">Fire Professor</button>
                </form>
              </>
            )}
            <button className="modal-close" onClick={() => setModal({ type: "" })}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
