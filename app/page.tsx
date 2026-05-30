"use client";

import { useMemo, useState, useEffect } from "react";
import TaskModal from "@/components/TaskModal";
import { Task, Columns, initialColumns, SPREADSHEET_API_URL } from "@/data/tasks";

export default function Home() {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [taskProgressMap, setTaskProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [sourceColumn, setSourceColumn] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // State Kontrol Tampilan Full Screen Modal (Menggantikan Drawer image_f07c04.png)
  const [showUnassignedFull, setShowUnassignedFull] = useState<boolean>(false);
  const [showArchiveFull, setShowArchiveFull] = useState<boolean>(false);
  
  const [searchUnassigned, setSearchUnassigned] = useState<string>("");
  const [searchArchive, setSearchArchive] = useState<string>("");

  const [modelers, setModelers] = useState<string[]>([]);
  const defaultModelers = [
    "Agnn", "Ajeng", "Aldi", "Alif", "Andrei", "Arkan", "Aini",
    "Budi", "Chandra", "Dewi", "Eko", "Eulia", "Faishal", "Fakhri",
    "Lutfhi", "Malika", "Miko", "Naila", "Nanda", "Nandito", "Nando",
    "Raihan", "Rizky", "Saka", "Salsa", "SMK", "Sadewa", "Syahid",
    "Tiara", "Yudha", "Yudis"
  ];

  // --- AMBIL DATA DARI SPREADSHEET (GET) ---
  const fetchSpreadsheetData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const response = await fetch(SPREADSHEET_API_URL, { method: "GET" });
      if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

      const responseBody = await response.json();
      const rawTasks = Array.isArray(responseBody) ? responseBody : responseBody.tasks ?? [];
      const apiModelers: string[] = !Array.isArray(responseBody) && Array.isArray(responseBody.modelerOptions)
        ? responseBody.modelerOptions
            .filter((item: unknown): item is string => typeof item === "string")
            .map((item: string) => item.trim())
        : [];

      if (Array.isArray(rawTasks)) {
        const updatedColumns: Columns = {
          TODO: [],
          WIP_BLENDER: [],
          WIP_REVIT: [],
          REVIEW: [],
          DONE_BLENDER: [],
          DONE_REVIT: []
        };
        const unassignedList: Task[] = [];

        const archivedList: Task[] = [];

        rawTasks.forEach((taskFromSheet: any) => {
          const currentStatus = (taskFromSheet.status || "Todo").trim();
          const upperStatus = currentStatus.toUpperCase();
          const assignedModeler = (taskFromSheet.assignedTo || "—").trim();
          const isArchived = taskFromSheet.archived === true || String(taskFromSheet.archived || "").toLowerCase() === "true";

          const rawProgress = String(taskFromSheet.progress ?? taskFromSheet.progressValue ?? "").replace(/[^0-9.-]+/g, "");
          const parsedProgress = rawProgress === "" ? NaN : Number(rawProgress);
          const formattedTask: Task = {
            id: taskFromSheet.id ? String(taskFromSheet.id) : String(Math.random()),
            title: taskFromSheet.title || "No Name",
            level: taskFromSheet.level || "—",
            assignedTo: taskFromSheet.assignedTo || "—",
            dueDate: taskFromSheet.dueDate || "—",
            priority: "Medium",
            mapId: taskFromSheet.mapId || "—",
            bdgId: taskFromSheet.bdgId || "—",
            nameJoin: taskFromSheet.nameJoin || "—",
            notes: taskFromSheet.notes || "",
            image: taskFromSheet.image || "",
            status: currentStatus,
            progress: Number.isNaN(parsedProgress) ? undefined : Math.min(100, Math.max(0, parsedProgress)),
            archived: isArchived,
            lat: taskFromSheet.lat || null,
            lon: taskFromSheet.lon || null,
            height: taskFromSheet.height || null,
          };

          if (isArchived) {
            archivedList.push(formattedTask);
            return;
          }

          // Jika status Todo/Kosong DAN belum di-assign, masuk ke Pool Unassigned
          if ((upperStatus === "TODO" || upperStatus === "") && (assignedModeler === "" || assignedModeler === "—")) {
            unassignedList.push(formattedTask);
          } else {
            if (upperStatus === "WIP BLENDER") {
              updatedColumns.WIP_BLENDER.push(formattedTask);
            } else if (upperStatus === "WIP REVIT") {
              updatedColumns.WIP_REVIT.push(formattedTask);
            } else if (upperStatus.includes("REVIEW") || upperStatus.includes("QC")) {
              updatedColumns.REVIEW.push(formattedTask);
            } else if (upperStatus === "DONE BLENDER") {
              updatedColumns.DONE_BLENDER.push(formattedTask);
            } else if (upperStatus === "DONE REVIT") {
              updatedColumns.DONE_REVIT.push(formattedTask);
            } else {
              updatedColumns.TODO.push(formattedTask);
            }
          }
        });

        setColumns(updatedColumns);
        setUnassignedTasks(unassignedList);
        setArchivedTasks(archivedList);

        if (apiModelers.length > 0) {
          setModelers([...new Set(apiModelers.map((m: any) => m?.toString().trim()).filter((m: string) => !!m))].sort((a, b) => a.localeCompare(b)));
        } else {
          const modelerNames = new Set<string>();
          rawTasks.forEach((taskFromSheet: any) => {
            const assigned = (taskFromSheet.assignedTo || "").trim();
            if (assigned && assigned !== "—") modelerNames.add(assigned);

            const fallback = (taskFromSheet.pjModeler || taskFromSheet.modeler || taskFromSheet.PJModeler || "").trim();
            if (fallback && fallback !== "—") modelerNames.add(fallback);
          });

          const sortedModelers = [...modelerNames].sort((a, b) => a.localeCompare(b));
          setModelers(sortedModelers.length > 0 ? sortedModelers : [...defaultModelers].sort((a, b) => a.localeCompare(b)));
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Gagal mengambil data dari Spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheetData();
  }, []);

  // --- AKSI RE-ASSIGN & UNASSIGN (Kombinasi Pool & Board Utama) ---
  async function updateTaskModeler(task: Task, currentColumn: string | null, targetModeler: string) {
    const isUnassigning = targetModeler === "—" || targetModeler === "";

    // 1. Jika Diubah ke Unassigned dari Board Utama
    if (isUnassigning && currentColumn) {
      const updatedTask = { ...task, assignedTo: "—", status: "Todo" };
      setColumns((prev) => ({
        ...prev,
        [currentColumn]: prev[currentColumn].filter((t) => t.id !== task.id),
      }));
      setUnassignedTasks((prev) => [...prev, updatedTask]);
    } 
    // 2. Jika Di-assign dari Pool Unassigned ke Modeler
    else if (!currentColumn && !isUnassigning) {
      const updatedTask = { ...task, assignedTo: targetModeler, status: "Todo" };
      setUnassignedTasks((prev) => prev.filter((t) => t.id !== task.id));
      setColumns((prev) => ({
        ...prev,
        TODO: [...prev.TODO, updatedTask]
      }));
    } 
    // 3. Jika Hanya Ganti Nama Modeler di Board Utama
    else if (currentColumn && !isUnassigning) {
      setColumns((prev) => ({
        ...prev,
        [currentColumn]: prev[currentColumn].map((t) => 
          t.id === task.id ? { ...t, assignedTo: targetModeler } : t
        ),
      }));
    }

    try {
      const updatedStatus = isUnassigning ? "Todo" : (task.status || "Todo");
      const response = await fetch(SPREADSHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify({
          id: task.id,
          bdgId: task.bdgId,
          assignedTo: targetModeler,
          status: updatedStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`Update modeler failed: ${response.status}`);
      }

      await fetchSpreadsheetData();
    } catch (err) {
      console.error("Gagal sinkronisasi update modeler:", err);
    }
  }

  function handleDragStart(task: Task, columnName: string) {
    setDraggedTask(task);
    setSourceColumn(columnName);
  }

  async function handleDrop(targetColumn: string) {
    if (!draggedTask) return;
    if (sourceColumn === targetColumn) return;

    let newStatusText = "Todo";
    if (targetColumn === "WIP_BLENDER") newStatusText = "WIP Blender";
    else if (targetColumn === "WIP_REVIT") newStatusText = "WIP Revit";
    else if (targetColumn === "REVIEW") newStatusText = "Review";
    else if (targetColumn === "DONE_BLENDER") newStatusText = "Done Blender";
    else if (targetColumn === "DONE_REVIT") newStatusText = "Done Revit";

    const updatedTask = { ...draggedTask, status: newStatusText };
    setColumns((prev) => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter((t) => t.id !== draggedTask.id),
      [targetColumn]: [...prev[targetColumn], updatedTask],
    }));

    try {
      await fetch(SPREADSHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ bdgId: draggedTask.bdgId, status: newStatusText }),
      });
    } catch (err) {
      console.error("Gagal sinkronisasi status:", err);
    }

    setDraggedTask(null);
  }

  const moveTaskToArchiveState = (task: Task) => {
    setColumns((prev) => {
      const updated = Object.fromEntries(
        Object.entries(prev).map(([key, tasks]) => [key, tasks.filter((t) => t.id !== task.id)])
      ) as Columns;
      return updated;
    });
    setArchivedTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
  };

  const restoreTaskFromState = (task: Task) => {
    setArchivedTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  async function archiveTask(task: Task) {
    try {
      const response = await fetch(SPREADSHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify({ id: task.id, bdgId: task.bdgId, archived: true }),
      });

      if (!response.ok) {
        throw new Error(`Archive failed: ${response.status}`);
      }

      moveTaskToArchiveState(task);
    } catch (err) {
      console.error("Gagal arsipkan tugas:", err);
      fetchSpreadsheetData();
    }
  }

  async function restoreTask(task: Task) {
    try {
      const response = await fetch(SPREADSHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify({ id: task.id, bdgId: task.bdgId, archived: false }),
      });

      if (!response.ok) {
        throw new Error(`Restore failed: ${response.status}`);
      }

      restoreTaskFromState(task);
      fetchSpreadsheetData();
    } catch (err) {
      console.error("Gagal kembalikan dari arsip:", err);
      fetchSpreadsheetData();
    }
  }

  const activeUsersFilter = useMemo(() => {
    const allUsers = Object.values(columns).flat().map((t) => t.assignedTo);
    return ["All", ...new Set(allUsers.filter(u => u !== "—"))];
  }, [columns]);

  const computeChecklistProgress = (savedData: any) => {
    if (!savedData || typeof savedData !== "object") return undefined;

    const geometry = Array.isArray(savedData.geometryChecks) ? savedData.geometryChecks.filter(Boolean).length : 0;
    const object = Array.isArray(savedData.objectChecks) ? savedData.objectChecks.filter(Boolean).length : 0;
    const texture = Array.isArray(savedData.textureChecks) ? savedData.textureChecks.filter(Boolean).length : 0;
    const export_ = Array.isArray(savedData.exportChecks) ? savedData.exportChecks.filter(Boolean).length : 0;

    const totalChecked = geometry + object + texture + export_;
    const totalChecklist = 16;
    return totalChecklist > 0 ? Math.round((totalChecked / totalChecklist) * 100) : undefined;
  };

  useEffect(() => {
    const loadedProgress: Record<string, number> = {};
    const allTasks = [...Object.values(columns).flat(), ...archivedTasks];

    allTasks.forEach((task) => {
      try {
        const saved = localStorage.getItem(`task_data_${task.id}`);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        const progress = computeChecklistProgress(parsed);
        if (typeof progress === "number") {
          loadedProgress[task.id] = progress;
        }
      } catch (error) {
        // ignore malformed storage
      }
    });

    setTaskProgressMap(loadedProgress);
  }, [columns, archivedTasks]);

  const getTaskProgress = (task: Task) => {
    const savedProgress = taskProgressMap[task.id];
    if (typeof savedProgress === "number" && !Number.isNaN(savedProgress)) {
      return Math.min(100, Math.max(0, savedProgress));
    }

    if (typeof task.progress === "number" && !Number.isNaN(task.progress)) {
      return Math.min(100, Math.max(0, task.progress));
    }

    const status = (task.status || "").toLowerCase();
    if (status.includes("done")) return 100;
    if (status.includes("review") || status.includes("qc")) return 80;
    if (status.includes("wip")) return 50;
    if (status.includes("todo")) return 20;
    return 10;
  };

const mainColumns = useMemo(() => {
  return {
    TODO: columns.TODO,
    WIP_BLENDER: columns.WIP_BLENDER,
    WIP_REVIT: columns.WIP_REVIT,
    REVIEW: columns.REVIEW,
    DONE_BLENDER: columns.DONE_BLENDER.slice(-6),
    DONE_REVIT: columns.DONE_REVIT.slice(-6),
  };
}, [columns]);

  const filteredUnassigned = useMemo(() => {
    return unassignedTasks.filter(t => 
      t.title.toLowerCase().includes(searchUnassigned.toLowerCase()) || 
      t.bdgId.toLowerCase().includes(searchUnassigned.toLowerCase())
    );
  }, [unassignedTasks, searchUnassigned]);

  const filteredArchive = useMemo(() => {
    return archivedTasks.filter(t => 
      t.title.toLowerCase().includes(searchArchive.toLowerCase()) || 
      t.bdgId.toLowerCase().includes(searchArchive.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(searchArchive.toLowerCase())
    );
  }, [archivedTasks, searchArchive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-zinc-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-black">Sebats bentaran...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6 selection:bg-sky-500/30 w-full overflow-x-hidden flex flex-col relative">
      
      {/* Header Workspace */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800 w-full">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100">MadingHub</h1>
          <p className="text-base text-zinc-400 mt-1">Digital wall for ideas and tasks.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setShowUnassignedFull(true)} 
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm px-4 py-2 rounded-lg border border-zinc-700 font-black transition-all flex items-center gap-2"
          >
            📋 Pool Unassigned 
            <span className="bg-zinc-700 text-zinc-200 text-xs px-1.5 py-0.5 rounded-md font-black">{unassignedTasks.length}</span>
          </button>

          <button 
            onClick={() => setShowArchiveFull(true)} 
            className="bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-sm px-4 py-2 rounded-lg border border-emerald-800/80 font-black transition-all flex items-center gap-2"
          >
            📦 Arsip Done
            <span className="bg-emerald-500 text-zinc-950 text-xs px-1.5 py-0.5 rounded-md font-black">{archivedTasks.length}</span>
          </button>

          <div className="h-6 w-[1px] bg-zinc-800 mx-1 hidden sm:block"></div>

          <button onClick={fetchSpreadsheetData} className="bg-zinc-800 hover:bg-zinc-700 text-sm px-4 py-2 rounded-lg border border-zinc-700 font-bold transition-all">🔄 Refresh</button>
          
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:border-sky-500">
            {activeUsersFilter.map((u) => <option key={u} value={u}>{u === "All" ? "Semua Modeler Aktif" : u}</option>)}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-3 rounded-xl text-sm mb-4">⚠️ {errorMessage}</div>
      )}

      {/* Grid Kanban Board Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start w-full flex-1">
        {Object.entries(mainColumns).map(([columnName, tasks]) => {
          const filteredTasks = selectedUser === "All" ? tasks : tasks.filter((t) => t.assignedTo === selectedUser);
          const isBlenderCol = columnName.includes("BLENDER");
          const isRevitCol = columnName.includes("REVIT");
          
          let headerColor = "text-zinc-400";
          if (isBlenderCol) headerColor = "text-orange-300";
          if (isRevitCol) headerColor = "text-sky-400";

          return (
            <div key={columnName} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(columnName)} className="bg-zinc-850/40 border border-zinc-800/80 rounded-xl p-4 w-full min-h-[760px] flex flex-col transition-all h-full">
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-zinc-800/60">
                <h2 className={`font-black text-[13px] uppercase tracking-wider ${headerColor}`}>{columnName.replace("_", " ")}</h2>
                <span className="bg-zinc-800 text-zinc-200 text-xs px-2.5 py-0.5 rounded border border-zinc-700 font-black">{filteredTasks.length}</span>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[75vh] pr-0.5 custom-scrollbar">
                {filteredTasks.map((task) => (
                  <div key={task.id} draggable onDragStart={() => handleDragStart(task, columnName)} onClick={() => setSelectedTask(task)} className="bg-zinc-800 hover:bg-zinc-750/90 rounded-xl p-4.5 cursor-grab active:cursor-grabbing border border-zinc-700/70 shadow-md transition-all group">
                    <div className="flex items-center justify-between gap-3 mb-3" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded ${isBlenderCol ? "bg-orange-900/20 text-orange-300 border border-orange-700/50" : isRevitCol ? "bg-sky-950 text-sky-400 border border-sky-900/50" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}>{isBlenderCol ? "Blender" : isRevitCol ? "Revit" : "General"}</span>
                      <div className="w-full max-w-[160px] text-right">
                        <div className="h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all"
                            style={{ width: `${getTaskProgress(task)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <h3 className="font-black text-base text-zinc-100 mb-4 leading-snug group-hover:text-white transition-colors">{task.title}</h3>
                    
                    <div className="space-y-3.5 text-sm font-bold text-zinc-300 border-t border-zinc-700/60 pt-3.5" onClick={(e) => e.stopPropagation()}>
                      {(columnName === "DONE_BLENDER" || columnName === "DONE_REVIT") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveTask(task);
                          }}
                          className="mt-3 w-full bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white text-xs font-bold py-1.5 rounded border border-zinc-700 transition"
                        >
                          ↙ Move to Archive
                        </button>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-zinc-400">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-zinc-200 font-semibold">{task.level || "—"}</span>
                          <span>•</span>
                          <span className={`${task.dueDate !== "—" ? "text-emerald-400" : "text-zinc-600"}`}>{task.dueDate}</span>
                        </div>
                        <select 
                          value={task.assignedTo || "—"} 
                          onChange={(e) => updateTaskModeler(task, columnName, e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-sky-400 text-[13px] font-black rounded px-3 py-2 min-w-[120px] focus:outline-none focus:border-sky-500"
                        >
                          <option value="—" className="text-amber-500 font-bold">⚠️ Unassigned</option>
                          {modelers.map((name) => (
                            <option key={name} value={name} className="text-zinc-200">{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && <div className="text-center py-10 text-sm text-zinc-600 border border-dashed border-zinc-800 rounded-xl font-black">Kosong</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== SCREEN OVERLAY 1: POOL UNASSIGNED (FULL LAYAR) ==================== */}
      {showUnassignedFull && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col p-8 overflow-hidden animate-fade-in">
          {/* Header Full Screen */}
          <div className="flex justify-between items-start pb-6 border-b border-zinc-800 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-amber-400">📋 Master Pool Unassigned Tasks</h2>
                <span className="bg-amber-500 text-zinc-950 text-sm font-black px-3 py-0.5 rounded-full">{unassignedTasks.length} Aset</span>
              </div>
              <p className="text-zinc-400 mt-1.5 text-sm">Gunakan kolom dropdown pada tiap kartu untuk mendistribusikan aset ke papan kerja modeler.</p>
            </div>
            <button onClick={() => setShowUnassignedFull(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-sm px-5 py-2.5 rounded-xl border border-zinc-700 transition-all">
              ✕ Tutup Dashboard [ESC]
            </button>
          </div>

          {/* Cari Cepat Data Banyak */}
          <div className="mb-6">
            <input 
              type="text" 
              placeholder="Ketik nama gedung, lokasi, atau ID aset untuk memfilter..." 
              value={searchUnassigned} 
              onChange={(e) => setSearchUnassigned(e.target.value)} 
              className="w-full max-w-xl bg-zinc-900 border border-zinc-750 rounded-xl px-5 py-3.5 text-base text-zinc-200 focus:outline-none focus:border-amber-500 font-bold shadow-inner"
            />
          </div>

          {/* Grid View Data Ratusan (Layout Lega) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12 pr-2 custom-scrollbar">
            {filteredUnassigned.map((task) => (
              <div key={task.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-5 shadow-lg hover:border-zinc-700/80 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-mono text-zinc-500 font-bold">ASET ID: {task.bdgId}</span>
                    <span className="bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-md text-xs font-black border border-zinc-700">Lvl: {task.level}</span>
                  </div>
                  <h4 className="font-black text-base text-zinc-100 leading-snug">{task.title}</h4>
                </div>

                {/* DROPDOWN SELECT MODELER  */}
                <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-zinc-400">Tugaskan ke:</span>
                  <select
                    value="—"
                    onChange={(e) => updateTaskModeler(task, null, e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-black rounded-lg px-3 py-2 flex-1 focus:outline-none focus:border-amber-500"
                  >
                    <option value="—">— Pilih Modeler —</option>
                    {modelers.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {filteredUnassigned.length === 0 && (
              <div className="col-span-full text-center py-24 text-zinc-600 font-black text-lg">Tidak ada sisa antrean unassigned yang ditemukan.</div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SCREEN OVERLAY 2: ARSIP DONE (FULL LAYAR) ==================== */}
      {showArchiveFull && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col p-8 overflow-hidden animate-fade-in">
          <div className="flex justify-between items-start pb-6 border-b border-zinc-800 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-zinc-300">📦 Gudang Arsip Pekerjaan Selesai</h2>
                <span className="bg-zinc-800 text-zinc-300 text-sm font-black px-3 py-0.5 rounded-full border border-zinc-700">{archivedTasks.length} Berkas</span>
              </div>
              <p className="text-zinc-400 mt-1.5 text-sm">Kumpulan seluruh riwayat bangunan yang telah selesai diverifikasi oleh tim produksi.</p>
            </div>
            <button onClick={() => setShowArchiveFull(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-sm px-5 py-2.5 rounded-xl border border-zinc-700 transition-all">
              ✕ Tutup Dashboard [ESC]
            </button>
          </div>

          <div className="mb-6">
            <input 
              type="text" 
              placeholder="Cari arsip berdasarkan nama gedung, id, atau nama modeler..." 
              value={searchArchive} 
              onChange={(e) => setSearchArchive(e.target.value)} 
              className="w-full max-w-xl bg-zinc-900 border border-zinc-750 rounded-xl px-5 py-3.5 text-base text-zinc-200 focus:outline-none focus:border-zinc-500 font-bold shadow-inner"
            />
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12 pr-2 custom-scrollbar">
            {filteredArchive.map((task) => (
              <div key={task.id} className="bg-zinc-900/50 border border-zinc-850 p-4.5 rounded-2xl opacity-80 hover:opacity-100 transition-all">
                <div className="flex justify-between text-xs font-mono font-bold mb-2">
                  <span className="text-zinc-600">ID: {task.bdgId}</span>
                  <span className={task.status.toUpperCase().includes("BLENDER") ? "text-orange-400" : "text-sky-500 font-black"}>{task.status}</span>
                </div>
                <h4 className="font-extrabold text-sm text-zinc-200 line-clamp-2 mb-3">{task.title}</h4>
                <div className="text-xs text-zinc-400 border-t border-zinc-850 pt-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-300">{task.assignedTo}</span>
                    <span className="text-zinc-300 font-mono">{task.level}</span>
                  </div>
                  <button
                    onClick={() => restoreTask(task)}
                    className="w-full bg-zinc-800 hover:bg-yellow-700 text-zinc-400 hover:text-white text-xs font-bold py-1.5 rounded border border-zinc-700 transition"
                  >
                    ↩ Restore from Archive
                  </button>
                </div>
              </div>
            ))}
            
            {filteredArchive.length === 0 && (
              <div className="col-span-full text-center py-24 text-zinc-700 font-black text-lg">Gudang arsip kosong.</div>
            )}
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => { setSelectedTask(null); fetchSpreadsheetData(); }} />
      )}
    </main>
  );
}